import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandTransfer } from './entities/land-transfer.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User } from '../auth/entities/user.entity';
import { CreateLandTransferDto } from './dto/create-land-transfer.dto';
import { UpdateLandTransferDto } from './dto/update-land-transfer.dto';
import { ApproveTransferDto } from './dto/approve-transfer.dto';
import { RejectTransferDto } from './dto/reject-transfer.dto';
import { TransferStatus, LandStatus } from '../common/enums/status.enum';
import { UserRole } from '../auth/enums/user-role.enum';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LandTransferService {
  constructor(
    @InjectRepository(LandTransfer)
    private transferRepository: Repository<LandTransfer>,
    @InjectRepository(LandRecord)
    private landRepository: Repository<LandRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
  ) {}

  async create(
    createLandTransferDto: CreateLandTransferDto,
    currentUser: User,
  ): Promise<LandTransfer> {
    const { landId, newOwnerId, transferNumber, ...transferData } =
      createLandTransferDto;

    // Check if transfer number already exists
    const existingTransfer = await this.transferRepository.findOne({
      where: { transferNumber },
    });
    if (existingTransfer) {
      throw new BadRequestException('Transfer number already exists');
    }

    // Find the land record
    const land = await this.landRepository.findOne({
      where: { id: landId },
      relations: ['owner'],
    });
    if (!land) {
      throw new NotFoundException('Land record not found');
    }

    // Check if current user is the owner or authorized personnel
    if (
      land.owner.id !== currentUser.id &&
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.REGISTRAR,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException(
        'Only the land owner or authorized personnel can initiate transfers',
      );
    }

    // Check if land is in transferable status
    if (
      land.status !== LandStatus.APPROVED &&
      land.status !== LandStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Land must be approved/active to be transferred',
      );
    }

    // Find the new owner
    const newOwner = await this.userRepository.findOne({
      where: { id: newOwnerId },
    });
    if (!newOwner) {
      throw new NotFoundException('New owner not found');
    }

    // Prevent self-transfer
    if (land.owner.id === newOwnerId) {
      throw new BadRequestException('Cannot transfer land to the same owner');
    }

    // Calculate tax amount if not provided (example: 5% of transfer value)
    const taxAmount =
      transferData.taxAmount || transferData.transferValue * 0.05;

    const transfer = this.transferRepository.create({
      ...transferData,
      transferNumber,
      taxAmount,
      currentOwner: land.owner,
      newOwner,
      land,
      status: TransferStatus.INITIATED,
      initiatedBy: currentUser.id,
    });

    // Mark land as under transfer
    land.status = LandStatus.UNDER_REVIEW;
    await this.landRepository.save(land);

    const savedTransfer = await this.transferRepository.save(transfer);

    // Cache the new transfer and invalidate related caches
    await this.redisService.cacheLandTransfer(
      savedTransfer.id,
      savedTransfer,
      600,
    );
    await this.redisService.invalidateUserTransfers(land.owner.id);
    await this.redisService.invalidateUserTransfers(newOwnerId);
    await this.redisService.invalidateTransferHistory(landId);

    // Invalidate district-based caches if land has district info
    if (land.district) {
      await this.redisService.invalidateDistrictTransfers(land.district);
    }

    return savedTransfer;
  }

  async findAll(user: User): Promise<LandTransfer[]> {
    // Create cache key based on user role and user ID
    const cacheKey = `transfers:all:${user.role}:${user.id}`;

    // Try to get from cache first
    const cachedTransfers =
      await this.redisService.get<LandTransfer[]>(cacheKey);
    if (cachedTransfers) {
      return cachedTransfers;
    }

    const query = this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.currentOwner', 'currentOwner')
      .leftJoinAndSelect('transfer.newOwner', 'newOwner')
      .leftJoinAndSelect('transfer.land', 'land');

    // Citizens can only see transfers they're involved in
    if (user.role === UserRole.CITIZEN) {
      query.where('currentOwner.id = :userId OR newOwner.id = :userId', {
        userId: user.id,
      });
    }
    // Land officers can see transfers in their district
    else if (user.role === UserRole.LAND_OFFICER) {
      query.where('land.district = :district', { district: user.district });
    }
    // Admins can see all transfers

    const transfers = await query
      .orderBy('transfer.createdAt', 'DESC')
      .getMany();

    // Cache the results for 5 minutes
    await this.redisService.set(cacheKey, transfers, 300);

    return transfers;
  }

  async findOne(id: string, user: User): Promise<LandTransfer> {
    // Try to get from cache first
    const cachedTransfer = await this.redisService.getCachedLandTransfer(id);
    if (cachedTransfer) {
      // Still need to check permissions for cached data
      if (user.role === UserRole.CITIZEN) {
        if (
          cachedTransfer.currentOwner.id !== user.id &&
          cachedTransfer.newOwner.id !== user.id
        ) {
          throw new ForbiddenException('Access denied');
        }
      }

      if (
        user.role === UserRole.LAND_OFFICER &&
        cachedTransfer.land.district !== user.district
      ) {
        throw new ForbiddenException('Access denied');
      }

      return cachedTransfer;
    }

    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ['currentOwner', 'newOwner', 'land', 'land.owner'],
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Check access permissions
    if (user.role === UserRole.CITIZEN) {
      if (
        transfer.currentOwner.id !== user.id &&
        transfer.newOwner.id !== user.id
      ) {
        throw new ForbiddenException('Access denied');
      }
    }

    if (
      user.role === UserRole.LAND_OFFICER &&
      transfer.land.district !== user.district
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Cache the transfer for future requests
    await this.redisService.cacheLandTransfer(id, transfer, 600);

    return transfer;
  }

  async update(
    id: string,
    updateLandTransferDto: UpdateLandTransferDto,
    user: User,
  ): Promise<LandTransfer> {
    const transfer = await this.findOne(id, user);

    // Only allow updates if transfer is initiated or pending
    if (
      ![TransferStatus.INITIATED, TransferStatus.PENDING_APPROVAL].includes(
        transfer.status,
      )
    ) {
      throw new BadRequestException('Cannot update transfer in current status');
    }

    // Only current owner or authorized personnel can update
    if (
      transfer.currentOwner.id !== user.id &&
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.REGISTRAR,
      ].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to update transfer',
      );
    }

    Object.assign(transfer, updateLandTransferDto);
    return this.transferRepository.save(transfer);
  }

  async approve(
    id: string,
    approveDto: ApproveTransferDto,
    user: User,
  ): Promise<LandTransfer> {
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.REGISTRAR,
      ].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to approve transfers',
      );
    }

    const transfer = await this.findOne(id, user);

    if (
      transfer.status !== TransferStatus.PENDING_APPROVAL &&
      transfer.status !== TransferStatus.INITIATED
    ) {
      throw new BadRequestException(
        'Transfer cannot be approved in current status',
      );
    }

    // Update transfer status
    transfer.status = TransferStatus.APPROVED;
    transfer.approvedBy = user.id;
    transfer.approvedAt = new Date();

    const updatedTransfer = await this.transferRepository.save(transfer);

    // Complete the transfer - update land ownership
    await this.completeTransfer(transfer);

    return updatedTransfer;
  }

  async reject(
    id: string,
    rejectDto: RejectTransferDto,
    user: User,
  ): Promise<LandTransfer> {
    if (
      ![
        UserRole.LAND_OFFICER,
        UserRole.DISTRICT_ADMIN,
        UserRole.REGISTRAR,
      ].includes(user.role)
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to reject transfers',
      );
    }

    const transfer = await this.findOne(id, user);

    if (
      ![TransferStatus.INITIATED, TransferStatus.PENDING_APPROVAL].includes(
        transfer.status,
      )
    ) {
      throw new BadRequestException(
        'Transfer cannot be rejected in current status',
      );
    }

    // Update transfer status
    transfer.status = TransferStatus.REJECTED;
    transfer.rejectionReason = rejectDto.rejectionReason;
    transfer.approvedBy = user.id;
    transfer.approvedAt = new Date();

    // Restore land status
    const land = await this.landRepository.findOne({
      where: { id: transfer.land.id },
    });
    if (land) {
      land.status = LandStatus.APPROVED;
      await this.landRepository.save(land);
    }

    return this.transferRepository.save(transfer);
  }

  async cancel(id: string, user: User): Promise<LandTransfer> {
    const transfer = await this.findOne(id, user);

    // Only current owner can cancel
    if (transfer.currentOwner.id !== user.id) {
      throw new ForbiddenException(
        'Only the current owner can cancel the transfer',
      );
    }

    if (
      ![TransferStatus.INITIATED, TransferStatus.PENDING_APPROVAL].includes(
        transfer.status,
      )
    ) {
      throw new BadRequestException(
        'Transfer cannot be cancelled in current status',
      );
    }

    transfer.status = TransferStatus.CANCELLED;

    // Restore land status
    const land = await this.landRepository.findOne({
      where: { id: transfer.land.id },
    });
    if (land) {
      land.status = LandStatus.APPROVED;
      await this.landRepository.save(land);
    }

    return this.transferRepository.save(transfer);
  }

  private async completeTransfer(transfer: LandTransfer): Promise<void> {
    // Update land ownership
    const land = await this.landRepository.findOne({
      where: { id: transfer.land.id },
    });
    if (land) {
      land.owner = transfer.newOwner;
      land.status = LandStatus.TRANSFERRED;
      await this.landRepository.save(land);
    }

    // Mark transfer as completed
    transfer.status = TransferStatus.COMPLETED;
    transfer.completedAt = new Date();
    await this.transferRepository.save(transfer);
  }

  async findByLand(landId: string): Promise<LandTransfer[]> {
    return this.transferRepository.find({
      where: { land: { id: landId } },
      relations: ['currentOwner', 'newOwner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<LandTransfer[]> {
    // Try to get from cache first
    const cachedTransfers =
      await this.redisService.getCachedUserTransfers(userId);
    if (cachedTransfers) {
      return cachedTransfers;
    }

    const transfers = await this.transferRepository.find({
      where: [{ currentOwner: { id: userId } }, { newOwner: { id: userId } }],
      relations: ['currentOwner', 'newOwner', 'land'],
      order: { createdAt: 'DESC' },
    });

    // Cache the results for 10 minutes
    await this.redisService.cacheUserTransfers(userId, transfers, 600);

    return transfers;
  }

  async getTransferStatistics(user: User): Promise<any> {
    // Create cache key based on user role and ID
    const cacheKey = `transfer:stats:${user.role}:${user.id}`;

    // Try to get from cache first
    const cachedStats = await this.redisService.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const query = this.transferRepository
      .createQueryBuilder('transfer')
      .leftJoin('transfer.land', 'land');

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      query.where(
        'transfer.currentOwner.id = :userId OR transfer.newOwner.id = :userId',
        { userId: user.id },
      );
    } else if (user.role === UserRole.LAND_OFFICER) {
      query.where('land.district = :district', { district: user.district });
    }

    const [total, pending, approved, completed, rejected, cancelled] =
      await Promise.all([
        query.getCount(),
        query
          .andWhere('transfer.status = :status', {
            status: TransferStatus.PENDING_APPROVAL,
          })
          .getCount(),
        query
          .andWhere('transfer.status = :status', {
            status: TransferStatus.APPROVED,
          })
          .getCount(),
        query
          .andWhere('transfer.status = :status', {
            status: TransferStatus.COMPLETED,
          })
          .getCount(),
        query
          .andWhere('transfer.status = :status', {
            status: TransferStatus.REJECTED,
          })
          .getCount(),
        query
          .andWhere('transfer.status = :status', {
            status: TransferStatus.CANCELLED,
          })
          .getCount(),
      ]);

    const stats = {
      total,
      pending,
      approved,
      completed,
      rejected,
      cancelled,
    };

    // Cache the statistics for 15 minutes
    await this.redisService.set(cacheKey, stats, 900);

    return stats;
  }

  // Additional Redis-optimized methods
  async getTransferHistory(
    landId: string,
    user: User,
  ): Promise<LandTransfer[]> {
    // Check permissions first
    const land = await this.landRepository.findOne({
      where: { id: landId },
      relations: ['owner'],
    });

    if (!land) {
      throw new NotFoundException('Land record not found');
    }

    if (user.role === UserRole.CITIZEN && land.owner.id !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    // Try to get from cache first
    const cachedHistory =
      await this.redisService.getCachedTransferHistory(landId);
    if (cachedHistory) {
      return cachedHistory;
    }

    const history = await this.transferRepository.find({
      where: { land: { id: landId } },
      relations: ['currentOwner', 'newOwner', 'land'],
      order: { createdAt: 'DESC' },
    });

    // Cache the history for 15 minutes
    await this.redisService.cacheTransferHistory(landId, history, 900);

    return history;
  }

  async getTransfersByDistrict(
    district: string,
    user: User,
  ): Promise<LandTransfer[]> {
    // Check permissions
    if (user.role === UserRole.LAND_OFFICER && user.district !== district) {
      throw new ForbiddenException('Access denied');
    }

    // Try to get from cache first
    const cachedTransfers =
      await this.redisService.getCachedDistrictTransfers(district);
    if (cachedTransfers) {
      return cachedTransfers;
    }

    const transfers = await this.transferRepository.find({
      where: { land: { district } },
      relations: ['currentOwner', 'newOwner', 'land'],
      order: { createdAt: 'DESC' },
    });

    // Cache for 20 minutes
    await this.redisService.cacheDistrictTransfers(district, transfers, 1200);

    return transfers;
  }

  async preloadTransferCaches(): Promise<void> {
    // Method to preload frequently accessed transfers into cache
    const recentTransfers = await this.transferRepository.find({
      where: {},
      relations: ['currentOwner', 'newOwner', 'land'],
      order: { createdAt: 'DESC' },
      take: 100, // Load the most recent 100 transfers
    });

    await this.redisService.warmTransferCache(recentTransfers);
  }

  async getCacheHealth(): Promise<any> {
    return await this.redisService.getCacheStats();
  }

  // Enhanced update method with cache invalidation
  private async invalidateRelatedCaches(transfer: LandTransfer): Promise<void> {
    // Invalidate specific transfer cache
    await this.redisService.invalidateLandTransfer(transfer.id);

    // Invalidate user caches
    await this.redisService.invalidateUserTransfers(transfer.currentOwner.id);
    await this.redisService.invalidateUserTransfers(transfer.newOwner.id);

    // Invalidate transfer history
    await this.redisService.invalidateTransferHistory(transfer.land.id);

    // Invalidate district cache if applicable
    if (transfer.land.district) {
      await this.redisService.invalidateDistrictTransfers(
        transfer.land.district,
      );
    }

    // Invalidate statistics caches (simplified approach)
    await this.redisService.del(
      `transfer:stats:${UserRole.CITIZEN}:${transfer.currentOwner.id}`,
    );
    await this.redisService.del(
      `transfer:stats:${UserRole.CITIZEN}:${transfer.newOwner.id}`,
    );
  }
}
