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
    // Check if parcel number already exists
    const existingParcel = await this.landRecordRepository.findOne({
      where: { parcelNumber: createLandRecordDto.parcelNumber },
    });
    if (existingParcel) {
      throw new ForbiddenException('Parcel number already exists');
    }

    // Check if UPI number already exists
    const existingUpi = await this.landRecordRepository.findOne({
      where: { upiNumber: createLandRecordDto.upiNumber },
    });
    if (existingUpi) {
      throw new ForbiddenException('UPI number already exists');
    }

    // Process spatial data if geometry is provided
    let geometryBuffer: Buffer | null = null;
    let centerPointBuffer: Buffer | null = null;

    if (createLandRecordDto.geometry) {
      try {
        // Convert GeoJSON to WKB using WKX
        const polygon = wkx.Geometry.parseGeoJSON(createLandRecordDto.geometry);
        geometryBuffer = polygon.toWkb();

        // Calculate center point if it's a polygon
        if (createLandRecordDto.geometry.type === 'Polygon') {
          const coordinates = (createLandRecordDto.geometry as Polygon)
            .coordinates[0];

          // Simple centroid calculation
          let centerLat = 0;
          let centerLng = 0;
          const numPoints = coordinates.length - 1; // Exclude the last point (same as first)

          for (let i = 0; i < numPoints; i++) {
            centerLng += coordinates[i][0];
            centerLat += coordinates[i][1];
          }

          centerLng /= numPoints;
          centerLat /= numPoints;

          const centerPoint: Point = {
            type: 'Point',
            coordinates: [centerLng, centerLat],
          };

          const centerGeometry = wkx.Geometry.parseGeoJSON(centerPoint);
          centerPointBuffer = centerGeometry.toWkb();
        }

        this.logger.log(
          `Processed spatial data for parcel ${createLandRecordDto.parcelNumber}`,
        );
      } catch (error) {
        this.logger.error('Failed to process spatial data:', error);
        throw new BadRequestException('Invalid geometry data provided');
      }
    }

    const landRecord = this.landRecordRepository.create({
      ...createLandRecordDto,
      owner,
      status: LandStatus.PENDING,
      registeredBy: owner.id,
      geometry: geometryBuffer,
      centerPoint: centerPointBuffer,
    });

    const savedRecord = await this.landRecordRepository.save(landRecord);

    // Calculate area using PostGIS if geometry was provided
    if (geometryBuffer) {
      try {
        await this.landRecordRepository
          .createQueryBuilder()
          .update(LandRecord)
          .set({
            calculatedArea: () => 'ST_Area(ST_GeomFromWKB(geometry))',
          })
          .where('id = :id', { id: savedRecord.id })
          .execute();

        // Get the updated record with calculated area
        const updatedRecord = await this.landRecordRepository.findOne({
          where: { id: savedRecord.id },
          relations: ['owner'],
        });

        this.logger.log(
          `Calculated area for parcel ${createLandRecordDto.parcelNumber}: ${updatedRecord?.calculatedArea} sq meters`,
        );
        return updatedRecord || savedRecord;
      } catch (error) {
        this.logger.error('Failed to calculate area using PostGIS:', error);
        return savedRecord;
      }
    }

    return savedRecord;
  }

  async findAll(user: User): Promise<LandRecord[]> {
    const query = this.landRecordRepository
      .createQueryBuilder('land')
      .leftJoinAndSelect('land.owner', 'owner');

    // Citizens can only see their own land records
    if (user.role === UserRole.CITIZEN) {
      query.where('land.owner.id = :userId', { userId: user.id });
    }
    // Land officers can see all records in their district
    else if (user.role === UserRole.LAND_OFFICER) {
      query.where('land.district = :district', { district: user.district });
    }
    // Admins can see all records

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

    // Check access permissions
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

    // Only allow updates if pending or by authorized personnel
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

  // Helper method to convert WKB geometry back to GeoJSON
  private convertWkbToGeoJSON(wkbBuffer: Buffer): any {
    try {
      const geometry = wkx.Geometry.parse(wkbBuffer);
      return geometry.toGeoJSON();
    } catch (error) {
      this.logger.error('Failed to convert WKB to GeoJSON:', error);
      return null;
    }
  }

  // Enhanced findOne that includes geometry as GeoJSON
  async findOneWithGeometry(
    id: string,
    user: User,
  ): Promise<LandRecord & { geoJsonGeometry?: any; geoJsonCenterPoint?: any }> {
    const landRecord = await this.findOne(id, user);

    const result: any = { ...landRecord };

    if (landRecord.geometry) {
      result.geoJsonGeometry = this.convertWkbToGeoJSON(landRecord.geometry);
    }

    if (landRecord.centerPoint) {
      result.geoJsonCenterPoint = this.convertWkbToGeoJSON(
        landRecord.centerPoint,
      );
    }

    return result;
  }
}
