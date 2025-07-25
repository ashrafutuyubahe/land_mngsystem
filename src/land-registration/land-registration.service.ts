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

    const landRecord = this.landRecordRepository.create({
      ...createLandRecordDto,
      owner,
      status: LandStatus.PENDING,
      registeredBy: owner.id,
    });

    const savedRecord = await this.landRecordRepository.save(landRecord);

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
}
