import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

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
  estimated_value: number;
  land_type: string;
  tenure_type: string;
}

@Injectable()
export class ClickHouseService {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const host = this.configService.get('CLICKHOUSE_HOST', 'localhost');
      const port = this.configService.get('CLICKHOUSE_PORT', '8123');
      const username = this.configService.get('CLICKHOUSE_USERNAME', 'default');
      const password = this.configService.get('CLICKHOUSE_PASSWORD', '');
      const database = this.configService.get(
        'CLICKHOUSE_DATABASE',
        'land_analytics',
      );

      this.client = createClient({
        url: `http://${host}:${port}`,
        username,
        password,
        database,
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('ClickHouse connection established successfully');

      // Create tables if they don't exist
      await this.createTables();
    } catch (error) {
      this.logger.error('Failed to initialize ClickHouse:', error);
      this.isConnected = false;
    }
  }

  private async createTables() {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS land_records_analytics (
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
          estimated_value Float64,
          land_type String,
          tenure_type String
        ) ENGINE = MergeTree()
        ORDER BY (district, created_at)
        PARTITION BY toYYYYMM(created_at)
      `;

      await this.client.command({
        query: createTableQuery,
      });

      this.logger.log('ClickHouse tables created successfully');
    } catch (error) {
      this.logger.error('Failed to create ClickHouse tables:', error);
    }
  }

  async syncLandRecord(record: LandRecordAnalytics): Promise<void> {
    if (!this.isConnected) {
      throw new Error('ClickHouse is not connected');
    }

    try {
      await this.client.insert({
        table: 'land_records_analytics',
        values: [record],
        format: 'JSONEachRow',
      });

      this.logger.debug(`Synced land record ${record.id} to ClickHouse`);
    } catch (error) {
      this.logger.error(`Failed to sync land record to ClickHouse:`, error);
      throw error;
    }
  }

  async bulkSyncLandRecords(records: LandRecordAnalytics[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('ClickHouse is not connected');
    }

    try {
      await this.client.insert({
        table: 'land_records_analytics',
        values: records,
        format: 'JSONEachRow',
      });

      this.logger.log(
        `Bulk synced ${records.length} land records to ClickHouse`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to bulk sync land records to ClickHouse:',
        error,
      );
      throw error;
    }
  }

  async getLandRecordsAnalytics(
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
  }> {
    if (!this.isConnected) {
      throw new Error('ClickHouse is not connected');
    }

    try {
      let whereClause = 'WHERE 1=1';
      const params: any = {};

      if (filters.district) {
        whereClause += ' AND district = {district:String}';
        params.district = filters.district;
      }

      if (filters.landUse) {
        whereClause += ' AND land_use = {landUse:String}';
        params.landUse = filters.landUse;
      }

      if (filters.status) {
        whereClause += ' AND status = {status:String}';
        params.status = filters.status;
      }

      if (filters.minArea !== undefined) {
        whereClause += ' AND area >= {minArea:Float64}';
        params.minArea = filters.minArea;
      }

      if (filters.maxArea !== undefined) {
        whereClause += ' AND area <= {maxArea:Float64}';
        params.maxArea = filters.maxArea;
      }

      if (filters.dateFrom) {
        whereClause += ' AND created_at >= {dateFrom:DateTime}';
        params.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        whereClause += ' AND created_at <= {dateTo:DateTime}';
        params.dateTo = filters.dateTo;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'DESC';

      // Get total count
      const countQuery = `SELECT count() as total FROM land_records_analytics ${whereClause}`;
      const countResult = await this.client.query({
        query: countQuery,
        query_params: params,
      });
      const countData = (await countResult.json()) as {
        data: { total: number }[];
      };
      const total = countData.data[0]?.total || 0;

      // Get paginated data
      const dataQuery = `
        SELECT * FROM land_records_analytics 
        ${whereClause} 
        ORDER BY ${sortBy} ${sortOrder} 
        LIMIT {limit:UInt64} 
        OFFSET {offset:UInt64}
      `;

      const dataResult = await this.client.query({
        query: dataQuery,
        query_params: {
          ...params,
          limit,
          offset,
        },
      });

      const resultData = (await dataResult.json()) as {
        data: LandRecordAnalytics[];
      };

      return {
        data: resultData.data || [],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        'Failed to get land records analytics from ClickHouse:',
        error,
      );
      throw error;
    }
  }

  async getAnalyticsStatistics(): Promise<{
    totalRecords: number;
    byDistrict: { district: string; count: number }[];
    byStatus: { status: string; count: number }[];
    byLandUse: { landUse: string; count: number }[];
    totalArea: number;
    averageArea: number;
    registrationTrend: { month: string; count: number }[];
  }> {
    if (!this.isConnected) {
      throw new Error('ClickHouse is not connected');
    }

    try {
      const queries = [
        'SELECT count() as total FROM land_records_analytics',
        'SELECT district, count() as count FROM land_records_analytics GROUP BY district ORDER BY count DESC',
        'SELECT status, count() as count FROM land_records_analytics GROUP BY status ORDER BY count DESC',
        'SELECT land_use, count() as count FROM land_records_analytics GROUP BY land_use ORDER BY count DESC',
        'SELECT sum(area) as totalArea, avg(area) as averageArea FROM land_records_analytics',
        'SELECT toYYYYMM(created_at) as month, count() as count FROM land_records_analytics WHERE created_at >= now() - INTERVAL 12 MONTH GROUP BY month ORDER BY month',
      ];

      const results = await Promise.all(
        queries.map((query) => this.client.query({ query })),
      );

      const [
        totalResult,
        districtResult,
        statusResult,
        landUseResult,
        aggregateResult,
        trendResult,
      ] = await Promise.all(results.map((r) => r.json()));

      return {
        totalRecords: (totalResult as any).data[0]?.total || 0,
        byDistrict: (districtResult as any).data || [],
        byStatus: (statusResult as any).data || [],
        byLandUse: (landUseResult as any).data || [],
        totalArea: (aggregateResult as any).data[0]?.totalArea || 0,
        averageArea: (aggregateResult as any).data[0]?.averageArea || 0,
        registrationTrend: (trendResult as any).data || [],
      };
    } catch (error) {
      this.logger.error(
        'Failed to get analytics statistics from ClickHouse:',
        error,
      );
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error('ClickHouse health check failed:', error);
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
