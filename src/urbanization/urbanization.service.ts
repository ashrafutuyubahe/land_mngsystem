import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConstructionPermit,
  PermitStatus,
  ConstructionType,
} from './entities/construction-permit.entity';
import {
  Inspection,
  InspectionType,
  InspectionStatus,
} from './entities/inspection.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateConstructionPermitDto } from './dto/create-construction-permit.dto';
import { UpdateConstructionPermitDto } from './dto/update-construction-permit.dto';

@Injectable()
export class UrbanizationService {
  constructor(
    @InjectRepository(ConstructionPermit)
    private permitRepository: Repository<ConstructionPermit>,
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
    @InjectRepository(LandRecord)
    private landRecordRepository: Repository<LandRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createPermit(
    createPermitDto: CreateConstructionPermitDto,
    applicant: User,
  ): Promise<ConstructionPermit> {
    // Verify land record exists and user has permission
    const landRecord = await this.landRecordRepository.findOne({
      where: { id: createPermitDto.landRecordId },
    });

    if (!landRecord) {
      throw new NotFoundException('Land record not found');
    }

    // Check if user owns the land or has permission
    if (
      applicant.role === UserRole.CITIZEN &&
      landRecord.ownerId !== applicant.id
    ) {
      throw new ForbiddenException(
        'You can only apply for permits on your own land',
      );
    }

    // Validate dates
    const startDate = new Date(createPermitDto.plannedStartDate);
    const endDate = new Date(createPermitDto.plannedCompletionDate);
    if (startDate >= endDate) {
      throw new BadRequestException(
        'Start date must be before completion date',
      );
    }

    const permit = this.permitRepository.create({
      ...createPermitDto,
      landRecord,
      applicant,
      status: PermitStatus.DRAFT,
      permitNumber: await this.generatePermitNumber(),
    });

    return await this.permitRepository.save(permit);
  }

  async findAllPermits(user: User): Promise<ConstructionPermit[]> {
    const queryBuilder = this.permitRepository
      .createQueryBuilder('permit')
      .leftJoinAndSelect('permit.landRecord', 'landRecord')
      .leftJoinAndSelect('permit.applicant', 'applicant')
      .leftJoinAndSelect('permit.reviewedBy', 'reviewedBy');

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      queryBuilder.andWhere('permit.applicant.id = :userId', {
        userId: user.id,
      });
    }

    return await queryBuilder.orderBy('permit.createdAt', 'DESC').getMany();
  }

  async findOnePermit(id: string, user: User): Promise<ConstructionPermit> {
    const permit = await this.permitRepository.findOne({
      where: { id },
      relations: ['landRecord', 'applicant', 'reviewedBy', 'inspections'],
    });

    if (!permit) {
      throw new NotFoundException('Construction permit not found');
    }

    // Check permissions
    if (user.role === UserRole.CITIZEN && permit.applicant.id !== user.id) {
      throw new ForbiddenException('You can only view your own permits');
    }

    return permit;
  }

  async updatePermit(
    id: string,
    updatePermitDto: UpdateConstructionPermitDto,
    user: User,
  ): Promise<ConstructionPermit> {
    const permit = await this.findOnePermit(id, user);

    // Citizens can only update certain fields for draft permits
    if (user.role === UserRole.CITIZEN) {
      if (permit.applicant.id !== user.id) {
        throw new ForbiddenException('You can only update your own permits');
      }

      if (permit.status !== PermitStatus.DRAFT) {
        throw new BadRequestException(
          'Can only update permits in draft status',
        );
      }

      // Citizens cannot update status or review fields
      const { status, reviewComments, ...allowedUpdates } = updatePermitDto;
      Object.assign(permit, allowedUpdates);
    } else {
      // Officials can update all fields
      Object.assign(permit, updatePermitDto);

      if (updatePermitDto.status && updatePermitDto.status !== permit.status) {
        permit.reviewedAt = new Date();
        permit.reviewedBy = user;
      }
    }

    return await this.permitRepository.save(permit);
  }

  async submitPermit(id: string, user: User): Promise<ConstructionPermit> {
    const permit = await this.findOnePermit(id, user);

    if (permit.applicant.id !== user.id) {
      throw new ForbiddenException('You can only submit your own permits');
    }

    if (permit.status !== PermitStatus.DRAFT) {
      throw new BadRequestException('Only draft permits can be submitted');
    }

    permit.status = PermitStatus.SUBMITTED;
    permit.submittedAt = new Date();

    return await this.permitRepository.save(permit);
  }

  async reviewPermit(
    id: string,
    decision: PermitStatus,
    comments: string,
    reviewer: User,
  ): Promise<ConstructionPermit> {
    // Only authorized officials can review permits
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.SYSTEM_ADMIN,
      ].includes(reviewer.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to review permits',
      );
    }

    const permit = await this.permitRepository.findOne({
      where: { id },
      relations: ['applicant'],
    });

    if (!permit) {
      throw new NotFoundException('Construction permit not found');
    }

    if (
      ![PermitStatus.SUBMITTED, PermitStatus.UNDER_REVIEW].includes(
        permit.status,
      )
    ) {
      throw new BadRequestException('Only submitted permits can be reviewed');
    }

    permit.status = decision;
    permit.reviewComments = comments;
    permit.reviewedAt = new Date();
    permit.reviewedBy = reviewer;

    // If approved, schedule initial inspection
    const savedPermit = await this.permitRepository.save(permit);

    if (decision === PermitStatus.APPROVED) {
      await this.scheduleInspection(
        permit.id,
        InspectionType.SITE_ASSESSMENT,
        reviewer,
      );
    }

    return savedPermit;
  }

  async scheduleInspection(
    permitId: string,
    inspectionType: InspectionType,
    scheduler: User,
  ): Promise<Inspection> {
    const permit = await this.permitRepository.findOne({
      where: { id: permitId },
    });

    if (!permit) {
      throw new NotFoundException('Construction permit not found');
    }

    if (permit.status !== PermitStatus.APPROVED) {
      throw new BadRequestException(
        'Can only schedule inspections for approved permits',
      );
    }

    // Check if this type of inspection already exists for this permit
    const existingInspection = await this.inspectionRepository.findOne({
      where: { permit: { id: permitId }, type: inspectionType },
    });

    if (existingInspection) {
      throw new BadRequestException(
        `${inspectionType} inspection already scheduled for this permit`,
      );
    }

    const inspection = this.inspectionRepository.create({
      permit,
      type: inspectionType,
      status: InspectionStatus.SCHEDULED,
      scheduledBy: scheduler,
      scheduledDate: new Date(),
    });

    return await this.inspectionRepository.save(inspection);
  }

  async findPermitInspections(
    permitId: string,
    user: User,
  ): Promise<Inspection[]> {
    // Verify user has access to this permit
    await this.findOnePermit(permitId, user);

    return await this.inspectionRepository.find({
      where: { permit: { id: permitId } },
      relations: ['scheduledBy', 'inspector'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async conductInspection(
    inspectionId: string,
    result: InspectionStatus,
    notes: string,
    inspector: User,
  ): Promise<Inspection> {
    // Only authorized officials can conduct inspections
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.SYSTEM_ADMIN,
      ].includes(inspector.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to conduct inspections',
      );
    }

    const inspection = await this.inspectionRepository.findOne({
      where: { id: inspectionId },
      relations: ['permit'],
    });

    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }

    if (inspection.status !== InspectionStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only scheduled inspections can be conducted',
      );
    }

    inspection.status = result;
    inspection.notes = notes;
    inspection.completedDate = new Date();
    inspection.inspector = inspector;

    return await this.inspectionRepository.save(inspection);
  }

  async getPermitStatistics(user: User): Promise<any> {
    const baseQuery = this.permitRepository.createQueryBuilder('permit');

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      baseQuery.andWhere('permit.applicant.id = :userId', { userId: user.id });
    }

    const [
      totalPermits,
      draftPermits,
      submittedPermits,
      underReviewPermits,
      approvedPermits,
      rejectedPermits,
      averageProcessingTime,
    ] = await Promise.all([
      baseQuery.getCount(),
      baseQuery
        .clone()
        .where('permit.status = :status', { status: PermitStatus.DRAFT })
        .getCount(),
      baseQuery
        .clone()
        .where('permit.status = :status', { status: PermitStatus.SUBMITTED })
        .getCount(),
      baseQuery
        .clone()
        .where('permit.status = :status', { status: PermitStatus.UNDER_REVIEW })
        .getCount(),
      baseQuery
        .clone()
        .where('permit.status = :status', { status: PermitStatus.APPROVED })
        .getCount(),
      baseQuery
        .clone()
        .where('permit.status = :status', { status: PermitStatus.REJECTED })
        .getCount(),
      this.calculateAverageProcessingTime(user),
    ]);

    return {
      totalPermits,
      statusBreakdown: {
        draft: draftPermits,
        submitted: submittedPermits,
        underReview: underReviewPermits,
        approved: approvedPermits,
        rejected: rejectedPermits,
      },
      averageProcessingTimeInDays: averageProcessingTime,
      approvalRate:
        totalPermits > 0
          ? ((approvedPermits / totalPermits) * 100).toFixed(2)
          : 0,
    };
  }

  private async calculateAverageProcessingTime(user: User): Promise<number> {
    const query = this.permitRepository
      .createQueryBuilder('permit')
      .select(
        'AVG(EXTRACT(EPOCH FROM (permit.reviewedAt - permit.submittedAt))/86400)',
        'avgDays',
      )
      .where('permit.status IN (:...statuses)', {
        statuses: [PermitStatus.APPROVED, PermitStatus.REJECTED],
      })
      .andWhere('permit.reviewedAt IS NOT NULL')
      .andWhere('permit.submittedAt IS NOT NULL');

    if (user.role === UserRole.CITIZEN) {
      query.andWhere('permit.applicant.id = :userId', { userId: user.id });
    }

    const result = await query.getRawOne();
    return result?.avgDays ? parseFloat(result.avgDays) : 0;
  }

  async removePermit(id: string, user: User): Promise<void> {
    const permit = await this.findOnePermit(id, user);

    // Only system admin can delete permits, or citizens can delete their own draft permits
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      if (
        user.role !== UserRole.CITIZEN ||
        permit.applicant.id !== user.id ||
        permit.status !== PermitStatus.DRAFT
      ) {
        throw new ForbiddenException('Cannot delete this permit');
      }
    }

    await this.permitRepository.remove(permit);
  }

  private async generatePermitNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.permitRepository.count()) + 1;
    return `CP-${year}-${count.toString().padStart(4, '0')}`;
  }
}
