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

@Injectable()
export class LandTransferService {
  constructor(
    @InjectRepository(LandTransfer)
    private transferRepository: Repository<LandTransfer>,
    @InjectRepository(LandRecord)
    private landRepository: Repository<LandRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

    return this.transferRepository.save(transfer);
  }

  async findAll(user: User): Promise<LandTransfer[]> {
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

    return query.orderBy('transfer.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, user: User): Promise<LandTransfer> {
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
    return this.transferRepository.find({
      where: [{ currentOwner: { id: userId } }, { newOwner: { id: userId } }],
      relations: ['currentOwner', 'newOwner', 'land'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTransferStatistics(user: User): Promise<any> {
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

    return {
      total,
      pending,
      approved,
      completed,
      rejected,
      cancelled,
    };
  }
}
