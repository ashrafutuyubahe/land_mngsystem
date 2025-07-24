import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstructionPermit } from './entities/construction-permit.entity';
import { Inspection } from './entities/inspection.entity';
import { CreateConstructionPermitDto } from './dto/create-construction-permit.dto';
import { UpdateConstructionPermitDto } from './dto/update-construction-permit.dto';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { PermitStatus, InspectionStatus } from './enums/construction.enum';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';
import { LandRecord } from '../land-registration/entities/land-record.entity';

@Injectable()
export class UrbanizationService {
  private readonly logger = new Logger(UrbanizationService.name);

  constructor(
    @InjectRepository(ConstructionPermit)
    private constructionPermitRepository: Repository<ConstructionPermit>,
    @InjectRepository(Inspection)
    private inspectionRepository: Repository<Inspection>,
    @InjectRepository(LandRecord)
    private landRecordRepository: Repository<LandRecord>,
  ) {}

  // Construction Permit Methods
  async createPermit(
    createPermitDto: CreateConstructionPermitDto,
    applicant: User,
  ): Promise<ConstructionPermit> {
    // Verify land record exists and belongs to applicant or they have permission
    const landRecord = await this.landRecordRepository.findOne({
      where: { id: createPermitDto.landRecordId },
      relations: ['owner'],
    });

    if (!landRecord) {
      throw new NotFoundException('Land record not found');
    }

    if (
      landRecord.owner.id !== applicant.id &&
      ![
        UserRole.LAND_OFFICER,
        UserRole.URBAN_PLANNER,
        UserRole.DISTRICT_ADMIN,
      ].includes(applicant.role)
    ) {
      throw new ForbiddenException(
        'You can only apply for permits on your own land',
      );
    }

    // Generate permit number
    const permitNumber = await this.generatePermitNumber();

    // Validate dates
    const startDate = new Date(createPermitDto.plannedStartDate);
    const completionDate = new Date(createPermitDto.plannedCompletionDate);

    if (completionDate <= startDate) {
      throw new BadRequestException('Completion date must be after start date');
    }

    const permit = this.constructionPermitRepository.create({
      ...createPermitDto,
      permitNumber,
      applicant,
      landRecord,
      plannedStartDate: startDate,
      plannedCompletionDate: completionDate,
      status: PermitStatus.DRAFT,
      documents: createPermitDto.documents
        ? JSON.stringify(createPermitDto.documents)
        : null,
    });

    const savedPermit = await this.constructionPermitRepository.save(permit);
    this.logger.log(`Construction permit created: ${permitNumber}`);

    return savedPermit;
  }

  async findAllPermits(user: User): Promise<ConstructionPermit[]> {
    const query = this.constructionPermitRepository
      .createQueryBuilder('permit')
      .leftJoinAndSelect('permit.applicant', 'applicant')
      .leftJoinAndSelect('permit.landRecord', 'landRecord')
      .leftJoinAndSelect('permit.inspections', 'inspections');

    // Filter based on user role
    if (user.role === UserRole.CITIZEN) {
      query.where('permit.applicant.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.URBAN_PLANNER) {
      query.where('landRecord.district = :district', {
        district: user.district,
      });
    }
    // Admins and other roles can see all permits

    return query.getMany();
  }

  async findOnePermit(id: string, user: User): Promise<ConstructionPermit> {
    const permit = await this.constructionPermitRepository.findOne({
      where: { id },
      relations: [
        'applicant',
        'landRecord',
        'inspections',
        'reviewedBy',
        'approvedBy',
      ],
    });

    if (!permit) {
      throw new NotFoundException('Construction permit not found');
    }

    // Check permissions
    if (user.role === UserRole.CITIZEN && permit.applicant.id !== user.id) {
      throw new ForbiddenException('Access denied to this permit');
    }

    return permit;
  }

  async updatePermit(
    id: string,
    updatePermitDto: UpdateConstructionPermitDto,
    user: User,
  ): Promise<ConstructionPermit> {
    const permit = await this.findOnePermit(id, user);

    // Only allow updates in certain statuses
    if (
      ![PermitStatus.DRAFT, PermitStatus.PENDING_DOCUMENTS].includes(
        permit.status,
      )
    ) {
      throw new BadRequestException('Cannot update permit in current status');
    }

    // Only applicant or authorized personnel can update
    if (
      permit.applicant.id !== user.id &&
      ![UserRole.URBAN_PLANNER, UserRole.DISTRICT_ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException('Insufficient permissions to update permit');
    }

    Object.assign(permit, updatePermitDto);

    if (updatePermitDto.documents) {
      permit.documents = JSON.stringify(updatePermitDto.documents);
    }

    return this.constructionPermitRepository.save(permit);
  }

  async submitPermit(id: string, user: User): Promise<ConstructionPermit> {
    const permit = await this.findOnePermit(id, user);

    if (permit.status !== PermitStatus.DRAFT) {
      throw new BadRequestException('Only draft permits can be submitted');
    }

    if (permit.applicant.id !== user.id) {
      throw new ForbiddenException('Only the applicant can submit the permit');
    }

    permit.status = PermitStatus.SUBMITTED;
    permit.submittedAt = new Date();

    return this.constructionPermitRepository.save(permit);
  }

  async reviewPermit(
    id: string,
    status: PermitStatus,
    comments: string,
    user: User,
  ): Promise<ConstructionPermit> {
    if (
      ![UserRole.URBAN_PLANNER, UserRole.DISTRICT_ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to review permits',
      );
    }

    const permit = await this.findOnePermit(id, user);

    if (
      ![PermitStatus.SUBMITTED, PermitStatus.UNDER_REVIEW].includes(
        permit.status,
      )
    ) {
      throw new BadRequestException(
        'Permit cannot be reviewed in current status',
      );
    }

    permit.status = status;
    permit.reviewComments = comments;
    permit.reviewedBy = user;
    permit.reviewedAt = new Date();

    if (status === PermitStatus.APPROVED) {
      permit.approvedBy = user;
      permit.approvedAt = new Date();
      // Set expiry date (e.g., 2 years from approval)
      permit.expiryDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
    } else if (status === PermitStatus.REJECTED) {
      permit.rejectionReason = comments;
    }

    return this.constructionPermitRepository.save(permit);
  }

  async removePermit(id: string, user: User): Promise<void> {
    const permit = await this.findOnePermit(id, user);

    // Only allow deletion in draft status
    if (permit.status !== PermitStatus.DRAFT) {
      throw new BadRequestException('Only draft permits can be deleted');
    }

    // Only applicant or admin can delete
    if (
      permit.applicant.id !== user.id &&
      ![UserRole.DISTRICT_ADMIN, UserRole.SYSTEM_ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException('Insufficient permissions to delete permit');
    }

    await this.constructionPermitRepository.remove(permit);
    this.logger.log(`Construction permit deleted: ${permit.permitNumber}`);
  }

  // Inspection Methods
  async createInspection(
    createInspectionDto: CreateInspectionDto,
    user: User,
  ): Promise<Inspection> {
    if (
      ![UserRole.URBAN_PLANNER, UserRole.DISTRICT_ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to create inspections',
      );
    }

    const permit = await this.constructionPermitRepository.findOne({
      where: { id: createInspectionDto.permitId },
    });

    if (!permit) {
      throw new NotFoundException('Construction permit not found');
    }

    if (permit.status !== PermitStatus.APPROVED) {
      throw new BadRequestException(
        'Can only create inspections for approved permits',
      );
    }

    // Generate inspection number
    const inspectionNumber = await this.generateInspectionNumber();

    const inspection = this.inspectionRepository.create({
      ...createInspectionDto,
      inspectionNumber,
      scheduledDate: new Date(createInspectionDto.scheduledDate),
      scheduledBy: user,
    });

    return this.inspectionRepository.save(inspection);
  }

  async findAllInspections(user: User): Promise<Inspection[]> {
    const query = this.inspectionRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.permit', 'permit')
      .leftJoinAndSelect('inspection.inspector', 'inspector')
      .leftJoinAndSelect('permit.applicant', 'applicant');

    // Filter based on user role
    if (user.role === UserRole.CITIZEN) {
      query.where('applicant.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.URBAN_PLANNER) {
      query
        .leftJoinAndSelect('permit.landRecord', 'landRecord')
        .where('landRecord.district = :district', { district: user.district });
    }

    return query.getMany();
  }

  async updateInspection(
    id: string,
    updateInspectionDto: UpdateInspectionDto,
    user: User,
  ): Promise<Inspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['inspector', 'permit'],
    });

    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }

    // Only inspector or authorized personnel can update
    if (
      inspection.inspector.id !== user.id &&
      ![UserRole.URBAN_PLANNER, UserRole.DISTRICT_ADMIN].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to update inspection',
      );
    }

    Object.assign(inspection, updateInspectionDto);

    if (updateInspectionDto.photos) {
      inspection.photos = JSON.stringify(updateInspectionDto.photos);
    }

    if (updateInspectionDto.documents) {
      inspection.documents = JSON.stringify(updateInspectionDto.documents);
    }

    if (updateInspectionDto.completedDate) {
      inspection.completedDate = new Date(updateInspectionDto.completedDate);
    }

    if (updateInspectionDto.nextInspectionDate) {
      inspection.nextInspectionDate = new Date(
        updateInspectionDto.nextInspectionDate,
      );
    }

    return this.inspectionRepository.save(inspection);
  }

  // Utility Methods
  private async generatePermitNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.constructionPermitRepository.count({
      where: {
        createdAt: new Date(year, 0, 1),
      },
    });
    return `CP-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  private async generateInspectionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const count = await this.inspectionRepository.count({
      where: {
        createdAt: new Date(year, month - 1, 1),
      },
    });
    return `INS-${year}${month.toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
  }
}
