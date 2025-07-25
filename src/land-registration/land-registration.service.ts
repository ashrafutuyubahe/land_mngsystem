import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as wkx from 'wkx';
import { Polygon, Point } from 'geojson';
import { LandRecord } from './entities/land-record.entity';
import { CreateLandRecordDto } from './dto/create-land-record.dto';
import { UpdateLandRecordDto } from './dto/update-land-record.dto';
import { User } from '../auth/entities/user.entity';
import { LandStatus } from '../common/enums/status.enum';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class LandRegistrationService {
  private readonly logger = new Logger(LandRegistrationService.name);

  constructor(
    @InjectRepository(LandRecord)
    private landRecordRepository: Repository<LandRecord>,
  ) {}

  async create(
    createLandRecordDto: CreateLandRecordDto,
    owner: User,
  ): Promise<LandRecord> {
    const existingParcel = await this.landRecordRepository.findOne({
      where: { parcelNumber: createLandRecordDto.parcelNumber },
    });
    if (existingParcel) {
      throw new ForbiddenException('Parcel number already exists');
    }

    const existingUpi = await this.landRecordRepository.findOne({
      where: { upiNumber: createLandRecordDto.upiNumber },
    });
    if (existingUpi) {
      throw new ForbiddenException('UPI number already exists');
    }

    // Process spatial data using WKX for PostGIS
    let processedGeometry: Buffer | null = null;
    let processedCenterPoint: Buffer | null = null;
    let calculatedArea: number | null = null;

    if (createLandRecordDto.geometry) {
      try {
        // Validate GeoJSON geometry
        if (createLandRecordDto.geometry.type !== 'Polygon') {
          throw new BadRequestException('Geometry must be a Polygon');
        }

        if (
          !createLandRecordDto.geometry.coordinates ||
          createLandRecordDto.geometry.coordinates.length === 0
        ) {
          throw new BadRequestException('Geometry coordinates are required');
        }

        // Convert GeoJSON Polygon to WKB using wkx
        const polygon = wkx.Geometry.parseGeoJSON(createLandRecordDto.geometry);
        processedGeometry = polygon.toWkb();

        // Calculate center point from polygon
        const centerPoint = this.calculateCenterPoint(
          createLandRecordDto.geometry,
        );
        const pointGeometry = wkx.Geometry.parseGeoJSON(centerPoint);
        processedCenterPoint = pointGeometry.toWkb();

        // Note: Area will be calculated using PostGIS ST_Area after saving
        // This ensures accurate area calculation in square meters
        calculatedArea = null; // Will be updated after database insert

        this.logger.log(
          `Processed geometry for parcel ${createLandRecordDto.parcelNumber}, WKB length: ${processedGeometry.length} bytes`,
        );
      } catch (error) {
        this.logger.error('Error processing geometry:', error);
        throw new BadRequestException(
          'Invalid geometry data: ' + error.message,
        );
      }
    }

    const landRecord = this.landRecordRepository.create({
      ...createLandRecordDto,
      geometry: null, // Will be set via raw SQL
      centerPoint: null, // Will be set via raw SQL
      calculatedArea,
      owner,
      status: LandStatus.PENDING,
      registeredBy: owner.id,
    });

    const savedRecord = await this.landRecordRepository.save(landRecord);

    // Update geometry fields using raw SQL to handle WKB properly
    if (processedGeometry) {
      await this.landRecordRepository.query(
        `UPDATE land_records SET 
         geometry = ST_SetSRID($1::geometry, 4326),
         "centerPoint" = ST_SetSRID($2::geometry, 4326)
         WHERE id = $3`,
        [processedGeometry, processedCenterPoint, savedRecord.id],
      );
    }

    // Calculate accurate area using PostGIS ST_Area if geometry exists
    if (processedGeometry) {
      try {
        const accurateArea = await this.calculateActualArea(savedRecord.id);
        if (accurateArea > 0) {
          await this.landRecordRepository.query(
            `UPDATE land_records SET "calculatedArea" = $1 WHERE id = $2`,
            [accurateArea, savedRecord.id],
          );
          savedRecord.calculatedArea = accurateArea;
          this.logger.log(
            `Updated area for parcel ${savedRecord.parcelNumber} with PostGIS calculation: ${accurateArea} sqm`,
          );
        }
      } catch (error) {
        this.logger.warn(
          'Could not calculate accurate area using PostGIS:',
          error.message,
        );
      }
    }

    this.logger.log(`Created land record ${savedRecord.id} with spatial data`);

    // Return the record with geometry data converted to GeoJSON for the response
    if (processedGeometry) {
      return await this.getLandRecordWithGeometry(savedRecord.id, owner);
    }

    return savedRecord;
  }

  async findAll(user: User): Promise<LandRecord[]> {
    const query = this.landRecordRepository
      .createQueryBuilder('land')
      .leftJoinAndSelect('land.owner', 'owner');

    if (user.role === UserRole.CITIZEN) {
      query.where('land.owner.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.LAND_OFFICER) {
      query.where('land.district = :district', { district: user.district });
    }

    return query.getMany();
  }

  async findOne(id: string, user: User): Promise<LandRecord> {
    const landRecord = await this.landRecordRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!landRecord) {
      throw new NotFoundException('Land record not found');
    }

    if (user.role === UserRole.CITIZEN && landRecord.owner.id !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (
      user.role === UserRole.LAND_OFFICER &&
      landRecord.district !== user.district
    ) {
      throw new ForbiddenException('Access denied');
    }

    return landRecord;
  }

  async update(
    id: string,
    updateLandRecordDto: UpdateLandRecordDto,
    user: User,
  ): Promise<LandRecord> {
    const landRecord = await this.findOne(id, user);

    if (
      landRecord.status !== LandStatus.PENDING &&
      user.role === UserRole.CITIZEN
    ) {
      throw new ForbiddenException('Cannot update approved land record');
    }

    Object.assign(landRecord, updateLandRecordDto);
    return this.landRecordRepository.save(landRecord);
  }

  async approve(id: string, user: User): Promise<LandRecord> {
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.REGISTRAR,
      ].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to approve land records',
      );
    }

    const landRecord = await this.findOne(id, user);

    if (
      landRecord.status !== LandStatus.PENDING &&
      landRecord.status !== LandStatus.UNDER_REVIEW
    ) {
      throw new ForbiddenException(
        'Land record cannot be approved in current status',
      );
    }

    landRecord.status = LandStatus.APPROVED;
    landRecord.approvedBy = user.id;
    landRecord.approvedAt = new Date();

    return this.landRecordRepository.save(landRecord);
  }

  async reject(id: string, reason: string, user: User): Promise<LandRecord> {
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.REGISTRAR,
      ].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to reject land records',
      );
    }

    const landRecord = await this.findOne(id, user);

    landRecord.status = LandStatus.REJECTED;
    landRecord.rejectionReason = reason;
    landRecord.approvedBy = user.id;
    landRecord.approvedAt = new Date();

    return this.landRecordRepository.save(landRecord);
  }

  async remove(id: string, user: User): Promise<void> {
    const landRecord = await this.findOne(id, user);

    // Only allow deletion if pending and by owner or authorized personnel
    if (
      landRecord.status !== LandStatus.PENDING &&
      user.role === UserRole.CITIZEN
    ) {
      throw new ForbiddenException('Cannot delete approved land record');
    }

    await this.landRecordRepository.remove(landRecord);
  }

  async findByOwner(ownerId: string): Promise<LandRecord[]> {
    return this.landRecordRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
  }

  async findByDistrict(district: string): Promise<LandRecord[]> {
    return this.landRecordRepository.find({
      where: { district },
      relations: ['owner'],
    });
  }

  // Helper methods for spatial data processing
  private calculateCenterPoint(polygon: Polygon): Point {
    // Calculate centroid of polygon (simple average of coordinates)
    const coordinates = polygon.coordinates[0]; // Get exterior ring
    let latSum = 0;
    let lngSum = 0;
    const pointCount = coordinates.length - 1; // Exclude closing point

    for (let i = 0; i < pointCount; i++) {
      lngSum += coordinates[i][0];
      latSum += coordinates[i][1];
    }

    return {
      type: 'Point',
      coordinates: [lngSum / pointCount, latSum / pointCount],
    };
  }

  // PostGIS spatial query methods
  async findLandRecordsWithinRadius(
    centerLat: number,
    centerLng: number,
    radiusMeters: number,
    user: User,
  ): Promise<LandRecord[]> {
    let query = `
      SELECT lr.*, 
             ST_Distance(
               ST_Transform(lr."centerPoint", 3857),
               ST_Transform(ST_GeomFromText($1, 4326), 3857)
             ) as distance
      FROM land_records lr
      WHERE lr."centerPoint" IS NOT NULL
        AND ST_DWithin(
          ST_Transform(lr."centerPoint", 3857),
          ST_Transform(ST_GeomFromText($1, 4326), 3857),
          $2
        )
    `;

    const params = [`POINT(${centerLng} ${centerLat})`, radiusMeters];

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      query += ' AND lr."ownerId" = $3';
      params.push(user.id);
    } else if (user.role === UserRole.LAND_OFFICER && user.district) {
      query += ' AND lr.district = $3';
      params.push(user.district);
    }

    query += ' ORDER BY distance ASC';

    const results = await this.landRecordRepository.query(query, params);
    return results;
  }

  async calculateActualArea(landRecordId: string): Promise<number> {
    // Use PostGIS to calculate accurate area
    const query = `
      SELECT ST_Area(ST_Transform(geometry, 3857)) as area_sqm
      FROM land_records
      WHERE id = $1 AND geometry IS NOT NULL
    `;

    const result = await this.landRecordRepository.query(query, [landRecordId]);
    return result[0]?.area_sqm ? parseFloat(result[0].area_sqm) : 0;
  }

  async checkGeometryOverlap(
    landRecordId1: string,
    landRecordId2: string,
  ): Promise<{
    overlaps: boolean;
    overlapArea?: number;
  }> {
    const query = `
      SELECT 
        ST_Overlaps(lr1.geometry, lr2.geometry) as overlaps,
        ST_Area(ST_Transform(ST_Intersection(lr1.geometry, lr2.geometry), 3857)) as overlap_area
      FROM land_records lr1, land_records lr2
      WHERE lr1.id = $1 AND lr2.id = $2
        AND lr1.geometry IS NOT NULL AND lr2.geometry IS NOT NULL
    `;

    const result = await this.landRecordRepository.query(query, [
      landRecordId1,
      landRecordId2,
    ]);

    if (result.length === 0) {
      return { overlaps: false };
    }

    return {
      overlaps: result[0].overlaps || false,
      overlapArea: parseFloat(result[0].overlap_area) || 0,
    };
  }

  // Method to convert WKB back to GeoJSON for API responses
  async getLandRecordWithGeometry(id: string, user: User): Promise<any> {
    const landRecord = await this.findOne(id, user);

    // Get geometry data using raw SQL to ensure proper WKB handling
    const geometryResult = await this.landRecordRepository.query(
      `SELECT 
         ST_AsBinary(geometry) as geometry_wkb,
         ST_AsBinary("centerPoint") as center_point_wkb,
         "calculatedArea"
       FROM land_records 
       WHERE id = $1`,
      [id],
    );

    if (geometryResult.length > 0) {
      const result = geometryResult[0];
      let geometryGeoJSON = null;
      let centerPointGeoJSON = null;

      try {
        // Convert main geometry WKB back to GeoJSON
        if (result.geometry_wkb) {
          const geometry = wkx.Geometry.parse(result.geometry_wkb);
          geometryGeoJSON = geometry.toGeoJSON();
        }

        // Convert center point WKB back to GeoJSON
        if (result.center_point_wkb) {
          const centerGeometry = wkx.Geometry.parse(result.center_point_wkb);
          centerPointGeoJSON = centerGeometry.toGeoJSON();
        }

        // Return land record with geometry data included
        return {
          ...landRecord,
          geometry: geometryGeoJSON, // Override null with GeoJSON
          centerPoint: centerPointGeoJSON, // Override null with GeoJSON
          calculatedArea: result.calculatedArea
            ? parseFloat(result.calculatedArea)
            : landRecord.calculatedArea,
          // Also provide in additional fields for clarity
          geoJsonGeometry: geometryGeoJSON,
          centerPointGeoJSON: centerPointGeoJSON,
        };
      } catch (error) {
        this.logger.error('Error converting WKB to GeoJSON:', error);
      }
    }

    return landRecord;
  }
}
