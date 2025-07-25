import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Process spatial data using PostGIS directly
    const { geometry, ...landRecordData } = createLandRecordDto;

    const landRecord = this.landRecordRepository.create({
      ...landRecordData,
      owner,
      status: LandStatus.PENDING,
      registeredBy: owner.id,
    });

    const savedRecord = await this.landRecordRepository.save(landRecord);

    // If geometry is provided, update the record with PostGIS spatial data
    if (geometry) {
      try {
        const geoJsonString = JSON.stringify(geometry);

        await this.landRecordRepository
          .createQueryBuilder()
          .update(LandRecord)
          .set({
            geometry: () => `ST_GeomFromGeoJSON('${geoJsonString}')`,
            centerPoint: () =>
              `ST_Centroid(ST_GeomFromGeoJSON('${geoJsonString}'))`,
            calculatedArea: () =>
              `ST_Area(ST_GeomFromGeoJSON('${geoJsonString}'))`,
          })
          .where('id = :id', { id: savedRecord.id })
          .execute();

        const updatedRecord = await this.landRecordRepository.findOne({
          where: { id: savedRecord.id },
          relations: ['owner'],
        });

        this.logger.log(
          `Processed spatial data for parcel ${createLandRecordDto.parcelNumber}`,
        );

        return updatedRecord || savedRecord;
      } catch (error) {
        this.logger.error('Failed to process spatial data:', error);
        throw new BadRequestException('Invalid geometry data provided');
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

  // Helper method to get geometry as GeoJSON using PostGIS
  async findOneWithGeometry(
    id: string,
    user: User,
  ): Promise<LandRecord & { geoJsonGeometry?: any; geoJsonCenterPoint?: any }> {
    const landRecord = await this.findOne(id, user);

    // Get geometry data as GeoJSON using PostGIS functions
    const geometryData = await this.landRecordRepository
      .createQueryBuilder('land')
      .select([
        'ST_AsGeoJSON(land.geometry) as geometry_geojson',
        'ST_AsGeoJSON(land.centerPoint) as center_point_geojson',
      ])
      .where('land.id = :id', { id })
      .getRawOne();

    const result: any = { ...landRecord };

    if (geometryData?.geometry_geojson) {
      try {
        result.geoJsonGeometry = JSON.parse(geometryData.geometry_geojson);
      } catch (error) {
        this.logger.error('Failed to parse geometry GeoJSON:', error);
      }
    }

    if (geometryData?.center_point_geojson) {
      try {
        result.geoJsonCenterPoint = JSON.parse(
          geometryData.center_point_geojson,
        );
      } catch (error) {
        this.logger.error('Failed to parse center point GeoJSON:', error);
      }
    }

    return result;
  }

  // Method to get all records with geometry as GeoJSON
  async findAllWithGeometry(user: User): Promise<any[]> {
    let query = this.landRecordRepository
      .createQueryBuilder('land')
      .leftJoinAndSelect('land.owner', 'owner')
      .addSelect([
        'ST_AsGeoJSON(land.geometry) as geometry_geojson',
        'ST_AsGeoJSON(land.centerPoint) as center_point_geojson',
      ]);

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      query = query.where('land.owner.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.LAND_OFFICER) {
      query = query.where('land.district = :district', {
        district: user.district,
      });
    }

    const results = await query.getRawAndEntities();

    return results.entities.map((entity, index) => {
      const raw = results.raw[index];
      const result: any = { ...entity };

      if (raw?.geometry_geojson) {
        try {
          result.geoJsonGeometry = JSON.parse(raw.geometry_geojson);
        } catch (error) {
          this.logger.error('Failed to parse geometry GeoJSON:', error);
        }
      }

      if (raw?.center_point_geojson) {
        try {
          result.geoJsonCenterPoint = JSON.parse(raw.center_point_geojson);
        } catch (error) {
          this.logger.error('Failed to parse center point GeoJSON:', error);
        }
      }

      return result;
    });
  }
}
