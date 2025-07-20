import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClickHouseClient } from '@clickhouse/client';

export interface LandRecordAnalytics {
  id: string;
  parcel_number: string;
  upi_number: string;
  land_use: string;
  area: number;
  district: string;
  sector: string;
  cell: string;
  village: string;
  status: string;
  owner_name: string;
  registration_date: Date;
  created_at: Date;
  updated_at: Date;
  lat?: number;
  lng?: number;
  estimated_value?: number;
  land_type?: string;
  tenure_type?: string;
}

export interface LandAnalyticsStats {
  total_records: number;
  total_area: number;
  avg_area: number;
  records_by_district: Record<string, number>;
  records_by_land_use: Record<string, number>;
  records_by_status: Record<string, number>;
  monthly_registrations: Array<{ month: string; count: number }>;
  area_distribution: Array<{ range: string; count: number }>;
}

// Helper interfaces for ClickHouse query results
interface BasicStatsResult {
  total_records: number;
  total_area: number;
  avg_area: number;
}

interface CountResult {
  total: number;
}

interface DistrictStatsResult {
  district: string;
  count: number;
}

interface LandUseStatsResult {
  land_use: string;
  count: number;
}

interface StatusStatsResult {
  status: string;
  count: number;
}

interface MonthlyRegistrationResult {
  month: string;
  count: number;
}

interface AreaDistributionResult {
  range: string;
  count: number;
}

interface HealthCheckResult {
  health: number;
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);

  constructor(
    @Inject('CLICKHOUSE_CLIENT')
    private readonly clickhouse: ClickHouseClient,
  ) {}

  async onModuleInit() {
    try {
      await this.createDatabase();
      await this.createTables();
      this.logger.log('ClickHouse initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize ClickHouse:', error);
    }
  }

  private async createDatabase() {
    const query = `CREATE DATABASE IF NOT EXISTS land_analytics`;
    await this.clickhouse.exec({ query });
    this.logger.log('ClickHouse database ensured');
  }

  private async createTables() {
    // Main land records analytics table
    const landRecordsTable = `
      CREATE TABLE IF NOT EXISTS land_analytics.land_records (
        id String,
        parcel_number String,
        upi_number String,
        land_use String,
        area Float64,
        district String,
        sector String,
        cell String,
        village String,
        status String,
        owner_name String,
        registration_date DateTime,
        created_at DateTime,
        updated_at DateTime,
        lat Nullable(Float64),
        lng Nullable(Float64),
        estimated_value Nullable(Float64),
        land_type Nullable(String),
        tenure_type Nullable(String),
        sync_timestamp DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (district, created_at)
      PARTITION BY toYYYYMM(created_at)
    `;

    // Land transactions for trend analysis
    const transactionsTable = `
      CREATE TABLE IF NOT EXISTS land_analytics.land_transactions (
        id String,
        land_record_id String,
        transaction_type String,
        from_owner String,
        to_owner String,
        transaction_value Float64,
        transaction_date DateTime,
        district String,
        created_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (district, transaction_date)
      PARTITION BY toYYYYMM(transaction_date)
    `;

    // Real-time activity log
    const activityTable = `
      CREATE TABLE IF NOT EXISTS land_analytics.activity_log (
        id String,
        user_id String,
        action String,
        resource_type String,
        resource_id String,
        metadata String,
        ip_address String,
        user_agent String,
        timestamp DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY timestamp
      PARTITION BY toYYYYMM(timestamp)
      TTL timestamp + INTERVAL 1 YEAR
    `;

    await this.clickhouse.exec({ query: landRecordsTable });
    await this.clickhouse.exec({ query: transactionsTable });
    await this.clickhouse.exec({ query: activityTable });

    this.logger.log('ClickHouse tables created successfully');
  }

  // Sync single land record to ClickHouse
  async syncLandRecord(record: LandRecordAnalytics): Promise<void> {
    try {
      // Use ON DUPLICATE KEY UPDATE equivalent for ClickHouse
      const query = `
        INSERT INTO land_analytics.land_records (
          id, parcel_number, upi_number, land_use, area, district, sector, 
          cell, village, status, owner_name, registration_date, created_at, 
          updated_at, lat, lng, estimated_value, land_type, tenure_type
        ) VALUES (
          {id:String}, {parcel_number:String}, {upi_number:String}, 
          {land_use:String}, {area:Float64}, {district:String}, {sector:String},
          {cell:String}, {village:String}, {status:String}, {owner_name:String},
          {registration_date:DateTime}, {created_at:DateTime}, {updated_at:DateTime},
          {lat:Nullable(Float64)}, {lng:Nullable(Float64)}, 
          {estimated_value:Nullable(Float64)}, {land_type:Nullable(String)}, 
          {tenure_type:Nullable(String)}
        )
      `;

      await this.clickhouse.insert({
        table: 'land_analytics.land_records',
        values: [record],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Synced land record ${record.id} to ClickHouse`);
    } catch (error) {
      this.logger.error(
        `Failed to sync land record ${record.id} to ClickHouse:`,
        error,
      );
      throw error;
    }
  }

  // Bulk sync multiple land records
  async bulkSyncLandRecords(records: LandRecordAnalytics[]): Promise<void> {
    if (records.length === 0) return;

    try {
      // Process in batches to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        await this.clickhouse.insert({
          table: 'land_analytics.land_records',
          values: batch,
          format: 'JSONEachRow',
        });

        this.logger.debug(
          `Synced batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${batch.length} records)`,
        );
      }

      this.logger.log(
        `Successfully synced ${records.length} land records to ClickHouse`,
      );
    } catch (error) {
      this.logger.error('Failed to bulk sync land records:', error);
      throw error;
    }
  }

  // Get paginated land records with advanced filtering
  async getLandRecordsAnalytics(filters: {
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
  }): Promise<{
    data: LandRecordAnalytics[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 100,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = filters;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];

    if (filters.district) {
      whereConditions.push(`district = '${filters.district}'`);
    }
    if (filters.landUse) {
      whereConditions.push(`land_use = '${filters.landUse}'`);
    }
    if (filters.status) {
      whereConditions.push(`status = '${filters.status}'`);
    }
    if (filters.minArea) {
      whereConditions.push(`area >= ${filters.minArea}`);
    }
    if (filters.maxArea) {
      whereConditions.push(`area <= ${filters.maxArea}`);
    }
    if (filters.dateFrom) {
      whereConditions.push(`created_at >= '${filters.dateFrom.toISOString()}'`);
    }
    if (filters.dateTo) {
      whereConditions.push(`created_at <= '${filters.dateTo.toISOString()}'`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Get total count
    const countQuery = `
      SELECT count() as total 
      FROM land_analytics.land_records 
      ${whereClause}
    `;

    const countResult = await this.clickhouse.query({
      query: countQuery,
      format: 'JSONEachRow',
    });

    const totalData = (await countResult.json()) as CountResult[];
    const total = totalData[0]?.total || 0;

    // Get paginated data
    const dataQuery = `
      SELECT * 
      FROM land_analytics.land_records 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const dataResult = await this.clickhouse.query({
      query: dataQuery,
      format: 'JSONEachRow',
    });

    const data = (await dataResult.json()) as LandRecordAnalytics[];

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get comprehensive analytics statistics
  async getLandAnalyticsStats(): Promise<LandAnalyticsStats> {
    const queries = {
      // Basic stats
      basicStats: `
        SELECT 
          count() as total_records,
          sum(area) as total_area,
          avg(area) as avg_area
        FROM land_analytics.land_records
      `,

      // Records by district
      byDistrict: `
        SELECT 
          district,
          count() as count
        FROM land_analytics.land_records
        GROUP BY district
        ORDER BY count DESC
      `,

      // Records by land use
      byLandUse: `
        SELECT 
          land_use,
          count() as count
        FROM land_analytics.land_records
        GROUP BY land_use
        ORDER BY count DESC
      `,

      // Records by status
      byStatus: `
        SELECT 
          status,
          count() as count
        FROM land_analytics.land_records
        GROUP BY status
      `,

      // Monthly registrations (last 12 months)
      monthlyRegistrations: `
        SELECT 
          formatDateTime(created_at, '%Y-%m') as month,
          count() as count
        FROM land_analytics.land_records
        WHERE created_at >= subtractMonths(now(), 12)
        GROUP BY month
        ORDER BY month
      `,

      // Area distribution
      areaDistribution: `
        SELECT 
          CASE 
            WHEN area <= 100 THEN '0-100m²'
            WHEN area <= 500 THEN '100-500m²'
            WHEN area <= 1000 THEN '500-1000m²'
            WHEN area <= 5000 THEN '1000-5000m²'
            ELSE '5000m²+'
          END as range,
          count() as count
        FROM land_analytics.land_records
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '0-100m²' THEN 1
            WHEN '100-500m²' THEN 2
            WHEN '500-1000m²' THEN 3
            WHEN '1000-5000m²' THEN 4
            ELSE 5
          END
      `,
    };

    try {
      const [
        basicStats,
        byDistrict,
        byLandUse,
        byStatus,
        monthlyRegistrations,
        areaDistribution,
      ] = await Promise.all([
        this.clickhouse
          .query({ query: queries.basicStats, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<BasicStatsResult[]>),
        this.clickhouse
          .query({ query: queries.byDistrict, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<DistrictStatsResult[]>),
        this.clickhouse
          .query({ query: queries.byLandUse, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<LandUseStatsResult[]>),
        this.clickhouse
          .query({ query: queries.byStatus, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<StatusStatsResult[]>),
        this.clickhouse
          .query({ query: queries.monthlyRegistrations, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<MonthlyRegistrationResult[]>),
        this.clickhouse
          .query({ query: queries.areaDistribution, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<AreaDistributionResult[]>),
      ]);

      return {
        total_records: basicStats[0]?.total_records || 0,
        total_area: basicStats[0]?.total_area || 0,
        avg_area: basicStats[0]?.avg_area || 0,
        records_by_district: byDistrict.reduce<Record<string, number>>(
          (acc, item) => {
            acc[item.district] = item.count;
            return acc;
          },
          {},
        ),
        records_by_land_use: byLandUse.reduce<Record<string, number>>(
          (acc, item) => {
            acc[item.land_use] = item.count;
            return acc;
          },
          {},
        ),
        records_by_status: byStatus.reduce<Record<string, number>>(
          (acc, item) => {
            acc[item.status] = item.count;
            return acc;
          },
          {},
        ),
        monthly_registrations: monthlyRegistrations,
        area_distribution: areaDistribution,
      };
    } catch (error) {
      this.logger.error('Failed to get analytics stats:', error);
      throw error;
    }
  }

  // Log user activity for analytics
  async logActivity(activity: {
    id: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.clickhouse.insert({
        table: 'land_analytics.activity_log',
        values: [
          {
            ...activity,
            metadata: JSON.stringify(activity.metadata || {}),
          },
        ],
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error('Failed to log activity:', error);
    }
  }

  // Health check for ClickHouse
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.clickhouse.query({
        query: 'SELECT 1 as health',
        format: 'JSONEachRow',
      });
      const data = (await result.json()) as HealthCheckResult[];
      return data[0]?.health === 1;
    } catch (error) {
      this.logger.error('ClickHouse health check failed:', error);
      return false;
    }
  }

  // Get district-specific analytics
  async getDistrictAnalytics(district: string): Promise<{
    total_records: number;
    total_area: number;
    avg_area: number;
    land_use_distribution: Record<string, number>;
    status_distribution: Record<string, number>;
    recent_registrations: number;
  }> {
    try {
      const queries = {
        basicStats: `
          SELECT 
            count() as total_records,
            sum(area) as total_area,
            avg(area) as avg_area
          FROM land_analytics.land_records
          WHERE district = '${district}'
        `,
        landUseDistribution: `
          SELECT 
            land_use,
            count() as count
          FROM land_analytics.land_records
          WHERE district = '${district}'
          GROUP BY land_use
        `,
        statusDistribution: `
          SELECT 
            status,
            count() as count
          FROM land_analytics.land_records
          WHERE district = '${district}'
          GROUP BY status
        `,
        recentRegistrations: `
          SELECT count() as count
          FROM land_analytics.land_records
          WHERE district = '${district}'
          AND created_at >= subtractDays(now(), 30)
        `,
      };

      const [
        basicStats,
        landUseDistribution,
        statusDistribution,
        recentRegistrations,
      ] = await Promise.all([
        this.clickhouse
          .query({ query: queries.basicStats, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<BasicStatsResult[]>),
        this.clickhouse
          .query({ query: queries.landUseDistribution, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<LandUseStatsResult[]>),
        this.clickhouse
          .query({ query: queries.statusDistribution, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<StatusStatsResult[]>),
        this.clickhouse
          .query({ query: queries.recentRegistrations, format: 'JSONEachRow' })
          .then((r) => r.json() as Promise<CountResult[]>),
      ]);

      return {
        total_records: basicStats[0]?.total_records || 0,
        total_area: basicStats[0]?.total_area || 0,
        avg_area: basicStats[0]?.avg_area || 0,
        land_use_distribution: landUseDistribution.reduce<
          Record<string, number>
        >((acc, item) => {
          acc[item.land_use] = item.count;
          return acc;
        }, {}),
        status_distribution: statusDistribution.reduce<Record<string, number>>(
          (acc, item) => {
            acc[item.status] = item.count;
            return acc;
          },
          {},
        ),
        recent_registrations: recentRegistrations[0]?.total || 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get district analytics for ${district}:`,
        error,
      );
      throw error;
    }
  }

  // Clear old data (useful for maintenance)
  async clearOldData(olderThanDays: number = 365): Promise<void> {
    try {
      const query = `
        ALTER TABLE land_analytics.activity_log
        DELETE WHERE timestamp < subtractDays(now(), ${olderThanDays})
      `;

      await this.clickhouse.exec({ query });
      this.logger.log(`Cleared activity logs older than ${olderThanDays} days`);
    } catch (error) {
      this.logger.error('Failed to clear old data:', error);
      throw error;
    }
  }

  // Get real-time metrics for dashboard
  async getRealTimeMetrics(): Promise<{
    registrations_today: number;
    registrations_this_week: number;
    registrations_this_month: number;
    active_users_today: number;
    popular_districts: Array<{ district: string; count: number }>;
  }> {
    try {
      const queries = {
        today: `
          SELECT count() as count
          FROM land_analytics.land_records
          WHERE toDate(created_at) = today()
        `,
        thisWeek: `
          SELECT count() as count
          FROM land_analytics.land_records
          WHERE created_at >= subtractDays(now(), 7)
        `,
        thisMonth: `
          SELECT count() as count
          FROM land_analytics.land_records
          WHERE toYYYYMM(created_at) = toYYYYMM(now())
        `,
        activeUsersToday: `
          SELECT count(DISTINCT user_id) as count
          FROM land_analytics.activity_log
          WHERE toDate(timestamp) = today()
        `,
        popularDistricts: `
          SELECT 
            district,
            count() as count
          FROM land_analytics.land_records
          WHERE created_at >= subtractDays(now(), 30)
          GROUP BY district
          ORDER BY count DESC
          LIMIT 5
        `,
      };

      const [today, thisWeek, thisMonth, activeUsersToday, popularDistricts] =
        await Promise.all([
          this.clickhouse
            .query({ query: queries.today, format: 'JSONEachRow' })
            .then((r) => r.json() as Promise<CountResult[]>),
          this.clickhouse
            .query({ query: queries.thisWeek, format: 'JSONEachRow' })
            .then((r) => r.json() as Promise<CountResult[]>),
          this.clickhouse
            .query({ query: queries.thisMonth, format: 'JSONEachRow' })
            .then((r) => r.json() as Promise<CountResult[]>),
          this.clickhouse
            .query({ query: queries.activeUsersToday, format: 'JSONEachRow' })
            .then((r) => r.json() as Promise<CountResult[]>),
          this.clickhouse
            .query({ query: queries.popularDistricts, format: 'JSONEachRow' })
            .then((r) => r.json() as Promise<DistrictStatsResult[]>),
        ]);

      return {
        registrations_today: today[0]?.total || 0,
        registrations_this_week: thisWeek[0]?.total || 0,
        registrations_this_month: thisMonth[0]?.total || 0,
        active_users_today: activeUsersToday[0]?.total || 0,
        popular_districts: popularDistricts,
      };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }
}
