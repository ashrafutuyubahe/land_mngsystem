import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { LandTax } from './entities/land-tax.entity';
import { LandRecord } from '../land-registration/entities/land-record.entity';
import { User } from '../auth/entities/user.entity';
import { CreateLandTaxDto } from './dto/create-land-tax.dto';
import { UpdateLandTaxDto } from './dto/update-land-tax.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { BulkTaxAssessmentDto } from './dto/bulk-tax-assessment.dto';
import { TaxStatus } from '../common/enums/status.enum';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class LandTaxesService {
  private readonly DEFAULT_TAX_RATE = 0.005; // 0.5%
  private readonly PENALTY_RATE = 0.02; // 2% per month

  constructor(
    @InjectRepository(LandTax)
    private taxRepository: Repository<LandTax>,
    @InjectRepository(LandRecord)
    private landRepository: Repository<LandRecord>,
  ) {}

  async create(createLandTaxDto: CreateLandTaxDto, user: User): Promise<LandTax> {
    // Only authorized personnel can create tax assessments
    if (![UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions to create tax assessments');
    }

    const { landId, taxRate, dueDate, ...taxData } = createLandTaxDto;

    // Find the land record
    const land = await this.landRepository.findOne({
      where: { id: landId },
      relations: ['owner'],
    });
    if (!land) {
      throw new NotFoundException('Land record not found');
    }

    // Check if tax already exists for this land and year
    const existingTax = await this.taxRepository.findOne({
      where: { land: { id: landId }, taxYear: taxData.taxYear }
    });
    if (existingTax) {
      throw new BadRequestException(`Tax assessment already exists for ${taxData.taxYear}`);
    }

    // Calculate tax amount
    const finalTaxRate = taxRate || this.DEFAULT_TAX_RATE;
    const taxAmount = taxData.assessedValue * finalTaxRate;

    // Set due date (default: end of tax year)
    const finalDueDate = dueDate ? new Date(dueDate) : new Date(taxData.taxYear, 11, 31);

    const tax = this.taxRepository.create({
      ...taxData,
      taxRate: finalTaxRate,
      taxAmount,
      dueDate: finalDueDate,
      land,
      status: TaxStatus.PENDING,
    });

    return this.taxRepository.save(tax);
  }

  async findAll(user: User, year?: number, status?: TaxStatus): Promise<LandTax[]> {
    const query = this.taxRepository.createQueryBuilder('tax')
      .leftJoinAndSelect('tax.land', 'land')
      .leftJoinAndSelect('land.owner', 'owner');

    // Apply filters
    if (year) {
      query.andWhere('tax.taxYear = :year', { year });
    }
    if (status) {
      query.andWhere('tax.status = :status', { status });
    }

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      query.andWhere('owner.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.TAX_OFFICER || user.role === UserRole.LAND_OFFICER) {
      query.andWhere('land.district = :district', { district: user.district });
    }
    // Admins can see all

    return query.orderBy('tax.dueDate', 'ASC').getMany();
  }

  async findOne(id: string, user: User): Promise<LandTax> {
    const tax = await this.taxRepository.findOne({
      where: { id },
      relations: ['land', 'land.owner'],
    });

    if (!tax) {
      throw new NotFoundException('Tax record not found');
    }

    // Check access permissions
    if (user.role === UserRole.CITIZEN && tax.land.owner.id !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if ((user.role === UserRole.TAX_OFFICER || user.role === UserRole.LAND_OFFICER) && 
        tax.land.district !== user.district) {
      throw new ForbiddenException('Access denied');
    }

    // Calculate penalties if overdue
    await this.calculatePenalties(tax);

    return tax;
  }

  async update(id: string, updateLandTaxDto: UpdateLandTaxDto, user: User): Promise<LandTax> {
    // Only authorized personnel can update tax assessments
    if (![UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions to update tax assessments');
    }

    const tax = await this.findOne(id, user);

    // Recalculate tax amount if assessed value or rate changed
    if (updateLandTaxDto.assessedValue || updateLandTaxDto.taxRate) {
      const assessedValue = updateLandTaxDto.assessedValue || tax.assessedValue;
      const taxRate = updateLandTaxDto.taxRate || tax.taxRate;
      updateLandTaxDto.taxAmount = assessedValue * taxRate;
    }

    Object.assign(tax, updateLandTaxDto);
    return this.taxRepository.save(tax);
  }

  async processPayment(id: string, paymentDto: ProcessPaymentDto, user: User): Promise<LandTax> {
    const tax = await this.findOne(id, user);

    // Update payment information
    const newPaidAmount = tax.paidAmount + paymentDto.paidAmount;
    tax.paidAmount = newPaidAmount;
    tax.paymentReference = paymentDto.paymentReference;
    tax.paidDate = new Date();

    // Update status based on payment
    const totalDue = tax.taxAmount + tax.penaltyAmount;
    if (newPaidAmount >= totalDue) {
      tax.status = TaxStatus.PAID;
    } else if (newPaidAmount > 0) {
      tax.status = TaxStatus.PARTIAL;
    }

    // Add payment notes
    if (paymentDto.notes) {
      tax.notes = tax.notes ? `${tax.notes}\n${paymentDto.notes}` : paymentDto.notes;
    }

    return this.taxRepository.save(tax);
  }

  async bulkAssessment(bulkDto: BulkTaxAssessmentDto, user: User): Promise<{ created: number; errors: string[] }> {
    // Only authorized personnel can perform bulk assessments
    if (![UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions for bulk tax assessment');
    }

    const { taxYear, defaultTaxRate, district, sector } = bulkDto;

    // Find eligible land records
    const query = this.landRepository.createQueryBuilder('land')
      .leftJoinAndSelect('land.owner', 'owner')
      .where('land.status IN (:...statuses)', { statuses: ['approved', 'active', 'transferred'] });

    if (district) {
      query.andWhere('land.district = :district', { district });
    }
    if (sector) {
      query.andWhere('land.sector = :sector', { sector });
    }

    const landRecords = await query.getMany();

    let created = 0;
    const errors: string[] = [];
    const taxRate = defaultTaxRate || this.DEFAULT_TAX_RATE;

    for (const land of landRecords) {
      try {
        // Check if tax already exists
        const existingTax = await this.taxRepository.findOne({
          where: { land: { id: land.id }, taxYear }
        });

        if (existingTax) {
          errors.push(`Tax already exists for land ${land.parcelNumber} (${taxYear})`);
          continue;
        }

        // Use government value or market value for assessment
        const assessedValue = land.governmentValue || land.marketValue || 0;
        if (assessedValue <= 0) {
          errors.push(`No valid assessed value for land ${land.parcelNumber}`);
          continue;
        }

        const taxAmount = assessedValue * taxRate;
        const dueDate = new Date(taxYear, 11, 31); // End of tax year

        const tax = this.taxRepository.create({
          taxYear,
          assessedValue,
          taxRate,
          taxAmount,
          dueDate,
          land,
          status: TaxStatus.PENDING,
          notes: `Bulk assessment for ${taxYear}`,
        });

        await this.taxRepository.save(tax);
        created++;
      } catch (error) {
        errors.push(`Error creating tax for land ${land.parcelNumber}: ${error.message}`);
      }
    }

    return { created, errors };
  }

  async getOverdueTaxes(user: User): Promise<LandTax[]> {
    const query = this.taxRepository.createQueryBuilder('tax')
      .leftJoinAndSelect('tax.land', 'land')
      .leftJoinAndSelect('land.owner', 'owner')
      .where('tax.dueDate < :now', { now: new Date() })
      .andWhere('tax.status IN (:...statuses)', { statuses: [TaxStatus.PENDING, TaxStatus.PARTIAL] });

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      query.andWhere('owner.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.TAX_OFFICER || user.role === UserRole.LAND_OFFICER) {
      query.andWhere('land.district = :district', { district: user.district });
    }

    const overdueTaxes = await query.getMany();

    // Calculate penalties for each overdue tax
    for (const tax of overdueTaxes) {
      await this.calculatePenalties(tax);
    }

    return overdueTaxes;
  }

  async getTaxStatistics(user: User, year?: number): Promise<any> {
    const query = this.taxRepository.createQueryBuilder('tax')
      .leftJoin('tax.land', 'land');

    if (year) {
      query.where('tax.taxYear = :year', { year });
    }

    // Apply user-based filtering
    if (user.role === UserRole.CITIZEN) {
      query.andWhere('land.owner.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.TAX_OFFICER || user.role === UserRole.LAND_OFFICER) {
      query.andWhere('land.district = :district', { district: user.district });
    }

    const [
      total,
      pending,
      paid,
      overdue,
      partial,
      exempted,
    ] = await Promise.all([
      query.getCount(),
      query.andWhere('tax.status = :status', { status: TaxStatus.PENDING }).getCount(),
      query.andWhere('tax.status = :status', { status: TaxStatus.PAID }).getCount(),
      query.andWhere('tax.status = :status', { status: TaxStatus.OVERDUE }).getCount(),
      query.andWhere('tax.status = :status', { status: TaxStatus.PARTIAL }).getCount(),
      query.andWhere('tax.status = :status', { status: TaxStatus.EXEMPTED }).getCount(),
    ]);

    // Calculate revenue statistics
    const revenueQuery = this.taxRepository.createQueryBuilder('tax')
      .select([
        'SUM(tax.taxAmount) as totalAssessed',
        'SUM(tax.paidAmount) as totalCollected',
        'SUM(tax.penaltyAmount) as totalPenalties',
      ])
      .leftJoin('tax.land', 'land');

    if (year) {
      revenueQuery.where('tax.taxYear = :year', { year });
    }

    // Apply same user filtering for revenue
    if (user.role === UserRole.CITIZEN) {
      revenueQuery.andWhere('land.owner.id = :userId', { userId: user.id });
    } else if (user.role === UserRole.TAX_OFFICER || user.role === UserRole.LAND_OFFICER) {
      revenueQuery.andWhere('land.district = :district', { district: user.district });
    }

    const revenue = await revenueQuery.getRawOne();

    return {
      counts: {
        total,
        pending,
        paid,
        overdue,
        partial,
        exempted,
      },
      revenue: {
        totalAssessed: parseFloat(revenue.totalAssessed) || 0,
        totalCollected: parseFloat(revenue.totalCollected) || 0,
        totalPenalties: parseFloat(revenue.totalPenalties) || 0,
        collectionRate: revenue.totalAssessed > 0 ? 
          (parseFloat(revenue.totalCollected) / parseFloat(revenue.totalAssessed)) * 100 : 0,
      },
    };
  }

  async findByLand(landId: string, user: User): Promise<LandTax[]> {
    return this.taxRepository.find({
      where: { land: { id: landId } },
      relations: ['land'],
      order: { taxYear: 'DESC' },
    });
  }

  async markAsExempt(id: string, reason: string, user: User): Promise<LandTax> {
    if (![UserRole.TAX_OFFICER, UserRole.DISTRICT_ADMIN, UserRole.REGISTRAR, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions to exempt taxes');
    }

    const tax = await this.findOne(id, user);
    tax.status = TaxStatus.EXEMPTED;
    tax.notes = tax.notes ? `${tax.notes}\nExempted: ${reason}` : `Exempted: ${reason}`;

    return this.taxRepository.save(tax);
  }

  private async calculatePenalties(tax: LandTax): Promise<void> {
    if (tax.status === TaxStatus.PAID || tax.status === TaxStatus.EXEMPTED) {
      return;
    }

    const now = new Date();
    if (now > tax.dueDate) {
      // Mark as overdue
      if (tax.status === TaxStatus.PENDING || tax.status === TaxStatus.PARTIAL) {
        tax.status = TaxStatus.OVERDUE;
      }

      // Calculate penalty (2% per month overdue)
      const monthsOverdue = Math.ceil((now.getTime() - tax.dueDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const penaltyAmount = tax.taxAmount * this.PENALTY_RATE * monthsOverdue;
      
      if (penaltyAmount > tax.penaltyAmount) {
        tax.penaltyAmount = penaltyAmount;
        await this.taxRepository.save(tax);
      }
    }
  }

  async remove(id: string, user: User): Promise<void> {
    if (![UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions to delete tax records');
    }

    const tax = await this.findOne(id, user);
    
    if (tax.status === TaxStatus.PAID || tax.status === TaxStatus.PARTIAL) {
      throw new BadRequestException('Cannot delete tax record with payments');
    }

    await this.taxRepository.remove(tax);
  }
}
