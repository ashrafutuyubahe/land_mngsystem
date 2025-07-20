import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandRecord } from './entities/land-record.entity';
import { CreateLandRecordDto } from './dto/create-land-record.dto';
import { UpdateLandRecordDto } from './dto/update-land-record.dto';
import { User } from '../auth/entities/user.entity';
import { LandStatus } from '../common/enums/status.enum';
import { UserRole } from '../auth/enums/user-role.enum';
import {
  ClickHouseService,
  LandRecordAnalytics,
} from '../clickhouse/clickhouse.service';

@Injectable()
export class LandRegistrationService {
  private readonly logger = new Logger(LandRegistrationService.name);

  constructor(
    @InjectRepository(LandRecord)
    private landRecordRepository: Repository<LandRecord>,
    private readonly clickHouseService: ClickHouseService,
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

    const landRecord = this.landRecordRepository.create({
      ...createLandRecordDto,
      owner,
      status: LandStatus.PENDING,
      registeredBy: owner.id,
    });

    const savedRecord = await this.landRecordRepository.save(landRecord);

    // Sync to ClickHouse for analytics (async, don't block the response)
    this.syncToClickHouse(savedRecord).catch((error) => {
      this.logger.error('Failed to sync land record to ClickHouse:', error);
    });

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

  // ClickHouse Analytics Integration
  private async syncToClickHouse(landRecord: LandRecord): Promise<void> {
    try {
      const analyticsRecord: LandRecordAnalytics = {
        id: landRecord.id,
        parcel_number: landRecord.parcelNumber,
        upi_number: landRecord.upiNumber,
        land_use: landRecord.landUseType,
        area: landRecord.area,
        district: landRecord.district,
        sector: landRecord.sector,
        cell: landRecord.cell,
        village: landRecord.village,
        status: landRecord.status,
        owner_name: `${landRecord.owner.firstName} ${landRecord.owner.lastName}`,
        registration_date: landRecord.createdAt,
        created_at: landRecord.createdAt,
        updated_at: landRecord.updatedAt,
        lat: landRecord.coordinates?.latitude,
        lng: landRecord.coordinates?.longitude,
        estimated_value: landRecord.marketValue,
        land_type: landRecord.landUseType,
        tenure_type: 'FREEHOLD', // Default value, can be extended later
      };

      await this.clickHouseService.syncLandRecord(analyticsRecord);
      this.logger.log(`Synced land record ${landRecord.id} to ClickHouse`);
    } catch (error) {
      this.logger.error(
        `Failed to sync land record ${landRecord.id} to ClickHouse:`,
        error,
      );
    }
  }

  // High-performance findAll using ClickHouse for large datasets
  async findAllAnalytics(
    user: User,
    filters: {
      district?: string;
      landUse?: string;
      status?: string;
      minArea?: number;
      maxArea?: number;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<{
    data: LandRecordAnalytics[];
    total: number;
    page: number;
    totalPages: number;
    source: 'clickhouse' | 'postgres';
  }> {
    try {
      // Apply user-based filtering
      const userFilters = { ...filters };

      if (user.role === UserRole.CITIZEN) {
        // Citizens can only see their own records - we need to get from PostgreSQL
        const records = await this.findAll(user);
        return {
          data: records.map((record) => this.transformToAnalytics(record)),
          total: records.length,
          page: filters.page || 1,
          totalPages: 1,
          source: 'postgres',
        };
      } else if (user.role === UserRole.LAND_OFFICER && user.district) {
        userFilters.district = user.district;
      }

      // Use ClickHouse for high-performance analytics
      const result =
        await this.clickHouseService.getLandRecordsAnalytics(userFilters);

      return {
        ...result,
        source: 'clickhouse',
      };
    } catch (error) {
      this.logger.error(
        'Failed to get analytics from ClickHouse, falling back to PostgreSQL:',
        error,
      );

      // Fallback to PostgreSQL
      const records = await this.findAll(user);
      return {
        data: records.map((record) => this.transformToAnalytics(record)),
        total: records.length,
        page: filters.page || 1,
        totalPages: 1,
        source: 'postgres',
      };
    }
  }

  private transformToAnalytics(record: LandRecord): LandRecordAnalytics {
    return {
      id: record.id,
      parcel_number: record.parcelNumber,
      upi_number: record.upiNumber,
      land_use: record.landUseType,
      area: record.area,
      district: record.district,
      sector: record.sector,
      cell: record.cell,
      village: record.village,
      status: record.status,
      owner_name: `${record.owner.firstName} ${record.owner.lastName}`,
      registration_date: record.createdAt,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      lat: record.coordinates?.latitude,
      lng: record.coordinates?.longitude,
      estimated_value: record.marketValue,
      land_type: record.landUseType,
      tenure_type: 'FREEHOLD', // Default value, can be extended later
    };
  }

  // Bulk sync all existing records to ClickHouse
  async bulkSyncToClickHouse(): Promise<{ synced: number; errors: number }> {
    try {
      this.logger.log('Starting bulk sync of land records to ClickHouse...');

      const batchSize = 1000;
      let offset = 0;
      let synced = 0;
      let errors = 0;

      while (true) {
        const records = await this.landRecordRepository.find({
          relations: ['owner'],
          take: batchSize,
          skip: offset,
        });

        if (records.length === 0) break;

        const analyticsRecords: LandRecordAnalytics[] = records.map((record) =>
          this.transformToAnalytics(record),
        );

        try {
          await this.clickHouseService.bulkSyncLandRecords(analyticsRecords);
          synced += records.length;
          this.logger.log(
            `Synced batch of ${records.length} records (total: ${synced})`,
          );
        } catch (error) {
          errors += records.length;
          this.logger.error(
            `Failed to sync batch starting at offset ${offset}:`,
            error,
          );
        }

        offset += batchSize;
      }

      this.logger.log(
        `Bulk sync completed. Synced: ${synced}, Errors: ${errors}`,
      );
      return { synced, errors };
    } catch (error) {
      this.logger.error('Bulk sync failed:', error);
      throw error;
    }
  }

  async findByDistrict(district: string): Promise<LandRecord[]> {
    return this.landRecordRepository.find({
      where: { district },
      relations: ['owner'],
    });
  }
}
