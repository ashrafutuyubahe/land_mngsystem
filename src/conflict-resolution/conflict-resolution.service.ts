import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';
import {
  Conflict,
  ConflictStatus,
  ConflictPriority,
} from './entities/conflict.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateConflictDto } from './dto/create-conflict.dto';
import { UpdateConflictDto } from './dto/update-conflict.dto';
import {
  ConflictFilterDto,
  AssignConflictDto,
} from './dto/conflict-filter.dto';

@Injectable()
export class ConflictResolutionService {
  constructor(
    @InjectRepository(Conflict)
    private conflictRepository: Repository<Conflict>,
    @InjectRepository(LandRecord)
    private landRecordRepository: Repository<LandRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createConflictDto: CreateConflictDto,
    reportedBy: User,
  ): Promise<Conflict> {
    // Verify land record exists
    const landRecord = await this.landRecordRepository.findOne({
      where: { id: createConflictDto.landRecordId },
    });

    if (!landRecord) {
      throw new NotFoundException('Land record not found');
    }

    // Check if user has permission to report conflict on this land
    if (
      reportedBy.role === UserRole.CITIZEN &&
      landRecord.ownerId !== reportedBy.id
    ) {
      throw new ForbiddenException(
        'You can only report conflicts for your own land',
      );
    }

    const conflict = this.conflictRepository.create({
      ...createConflictDto,
      landRecord,
      reportedBy,
      status: ConflictStatus.REPORTED,
      reportedAt: new Date(),
      caseNumber: await this.generateCaseNumber(),
    });

    return await this.conflictRepository.save(conflict);
  }

  async findAll(
    filters: ConflictFilterDto = {},
    user: User,
  ): Promise<Conflict[]> {
    const queryBuilder = this.conflictRepository
      .createQueryBuilder('conflict')
      .leftJoinAndSelect('conflict.landRecord', 'landRecord')
      .leftJoinAndSelect('conflict.reportedBy', 'reportedBy')
      .leftJoinAndSelect('conflict.assignedTo', 'assignedTo');

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      queryBuilder.andWhere('conflict.reportedBy.id = :userId', {
        userId: user.id,
      });
    }

    // Apply filters
    if (filters.conflictType) {
      queryBuilder.andWhere('conflict.conflictType = :conflictType', {
        conflictType: filters.conflictType,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('conflict.status = :status', {
        status: filters.status,
      });
    }

    if (filters.priority) {
      queryBuilder.andWhere('conflict.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.reportedAfter) {
      queryBuilder.andWhere('conflict.reportedAt >= :reportedAfter', {
        reportedAfter: filters.reportedAfter,
      });
    }

    if (filters.reportedBefore) {
      queryBuilder.andWhere('conflict.reportedAt <= :reportedBefore', {
        reportedBefore: filters.reportedBefore,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(conflict.title ILIKE :search OR conflict.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return await queryBuilder
      .orderBy('conflict.priority', 'DESC')
      .addOrderBy('conflict.reportedAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Conflict> {
    const conflict = await this.conflictRepository.findOne({
      where: { id },
      relations: ['landRecord', 'reportedBy', 'assignedTo'],
    });

    if (!conflict) {
      throw new NotFoundException('Conflict not found');
    }

    // Check permissions
    if (user.role === UserRole.CITIZEN && conflict.reportedBy.id !== user.id) {
      throw new ForbiddenException('You can only view your own conflicts');
    }

    return conflict;
  }

  async update(
    id: string,
    updateConflictDto: UpdateConflictDto,
    user: User,
  ): Promise<Conflict> {
    const conflict = await this.findOne(id, user);

    // Citizens can only update certain fields and only for their own conflicts
    if (user.role === UserRole.CITIZEN) {
      if (conflict.reportedBy.id !== user.id) {
        throw new ForbiddenException('You can only update your own conflicts');
      }

      // Citizens cannot update status or resolution notes
      const { status, resolutionNotes, ...allowedUpdates } = updateConflictDto;
      Object.assign(conflict, allowedUpdates);
    } else {
      // Officials can update all fields
      Object.assign(conflict, updateConflictDto);

      if (
        updateConflictDto.status === ConflictStatus.RESOLVED &&
        updateConflictDto.resolutionNotes
      ) {
        conflict.resolvedAt = new Date();
        conflict.resolvedBy = user;
      }
    }

    return await this.conflictRepository.save(conflict);
  }

  async assignToOfficer(
    id: string,
    assignDto: AssignConflictDto,
    user: User,
  ): Promise<Conflict> {
    // Only land officers and above can assign conflicts
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.SYSTEM_ADMIN,
      ].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to assign conflicts',
      );
    }

    const conflict = await this.conflictRepository.findOne({
      where: { id },
      relations: ['assignedTo'],
    });

    if (!conflict) {
      throw new NotFoundException('Conflict not found');
    }

    const officer = await this.userRepository.findOne({
      where: { id: assignDto.assignedToId },
    });

    if (!officer) {
      throw new NotFoundException('Officer not found');
    }

    // Verify the officer has appropriate role
    if (
      ![UserRole.LAND_OFFICER, UserRole.DISTRICT_ADMIN].includes(officer.role)
    ) {
      throw new BadRequestException(
        'Can only assign to land officers or district administrators',
      );
    }

    conflict.assignedTo = officer;
    conflict.status = ConflictStatus.INVESTIGATING;
    conflict.assignmentNotes = assignDto.assignmentNotes;
    conflict.assignedAt = new Date();

    return await this.conflictRepository.save(conflict);
  }

  async getStatistics(user: User): Promise<any> {
    const baseQuery = this.conflictRepository.createQueryBuilder('conflict');

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      baseQuery.andWhere('conflict.reportedBy.id = :userId', {
        userId: user.id,
      });
    }

    const [
      totalConflicts,
      reportedConflicts,
      investigatingConflicts,
      mediatingConflicts,
      resolvedConflicts,
      highPriorityConflicts,
      averageResolutionTime,
    ] = await Promise.all([
      baseQuery.getCount(),
      baseQuery
        .clone()
        .where('conflict.status = :status', { status: ConflictStatus.REPORTED })
        .getCount(),
      baseQuery
        .clone()
        .where('conflict.status = :status', {
          status: ConflictStatus.INVESTIGATING,
        })
        .getCount(),
      baseQuery
        .clone()
        .where('conflict.status = :status', {
          status: ConflictStatus.MEDIATING,
        })
        .getCount(),
      baseQuery
        .clone()
        .where('conflict.status = :status', { status: ConflictStatus.RESOLVED })
        .getCount(),
      baseQuery
        .clone()
        .where('conflict.priority = :priority', {
          priority: ConflictPriority.HIGH,
        })
        .getCount(),
      this.calculateAverageResolutionTime(user),
    ]);

    return {
      totalConflicts,
      statusBreakdown: {
        reported: reportedConflicts,
        investigating: investigatingConflicts,
        mediating: mediatingConflicts,
        resolved: resolvedConflicts,
      },
      highPriorityConflicts,
      averageResolutionTimeInDays: averageResolutionTime,
      resolutionRate:
        totalConflicts > 0
          ? ((resolvedConflicts / totalConflicts) * 100).toFixed(2)
          : 0,
    };
  }

  private async calculateAverageResolutionTime(user: User): Promise<number> {
    const query = this.conflictRepository
      .createQueryBuilder('conflict')
      .select(
        'AVG(EXTRACT(EPOCH FROM (conflict.resolvedAt - conflict.reportedAt))/86400)',
        'avgDays',
      )
      .where('conflict.status = :status', { status: ConflictStatus.RESOLVED })
      .andWhere('conflict.resolvedAt IS NOT NULL');

    if (user.role === UserRole.CITIZEN) {
      query.andWhere('conflict.reportedBy.id = :userId', { userId: user.id });
    }

    const result = await query.getRawOne();
    return result?.avgDays ? parseFloat(result.avgDays) : 0;
  }

  async getOverdueConflicts(user: User): Promise<Conflict[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const queryBuilder = this.conflictRepository
      .createQueryBuilder('conflict')
      .leftJoinAndSelect('conflict.landRecord', 'landRecord')
      .leftJoinAndSelect('conflict.reportedBy', 'reportedBy')
      .leftJoinAndSelect('conflict.assignedTo', 'assignedTo')
      .where('conflict.reportedAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('conflict.status != :resolvedStatus', {
        resolvedStatus: ConflictStatus.RESOLVED,
      });

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      queryBuilder.andWhere('conflict.reportedBy.id = :userId', {
        userId: user.id,
      });
    }

    return await queryBuilder.orderBy('conflict.reportedAt', 'ASC').getMany();
  }

  async remove(id: string, user: User): Promise<void> {
    const conflict = await this.findOne(id, user);

    // Only system admin can delete conflicts, or citizens can delete their own unassigned conflicts
    if (user.role !== UserRole.SYSTEM_ADMIN) {
      if (
        user.role !== UserRole.CITIZEN ||
        conflict.reportedBy.id !== user.id ||
        conflict.assignedTo
      ) {
        throw new ForbiddenException('Cannot delete this conflict');
      }
    }

    await this.conflictRepository.remove(conflict);
  }

  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = (await this.conflictRepository.count()) + 1;
    return `CON-${year}-${count.toString().padStart(4, '0')}`;
  }
}
