import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Generic cache methods
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // Land Transfer specific cache keys
  private getLandTransferKey(id: string): string {
    return `land_transfer:${id}`;
  }

  private getLandTransfersListKey(filters: any): string {
    const filterString = JSON.stringify(filters);
    return `land_transfers:list:${Buffer.from(filterString).toString('base64')}`;
  }

  private getTransferHistoryKey(landId: string): string {
    return `land_transfer:history:${landId}`;
  }

  private getTransferStatsKey(period: string): string {
    return `land_transfer:stats:${period}`;
  }

  private getUserTransfersKey(userId: string): string {
    return `land_transfer:user:${userId}`;
  }

  private getDistrictTransfersKey(district: string): string {
    return `land_transfer:district:${district}`;
  }

  // Land Transfer cache operations
  async cacheLandTransfer(
    id: string,
    transfer: any,
    ttl: number = 600,
  ): Promise<void> {
    await this.set(this.getLandTransferKey(id), transfer, ttl);
  }

  async getCachedLandTransfer(id: string): Promise<any> {
    return await this.get(this.getLandTransferKey(id));
  }

  async invalidateLandTransfer(id: string): Promise<void> {
    await this.del(this.getLandTransferKey(id));
  }

  async cacheTransfersList(
    filters: any,
    transfers: any,
    ttl: number = 300,
  ): Promise<void> {
    await this.set(this.getLandTransfersListKey(filters), transfers, ttl);
  }

  async getCachedTransfersList(filters: any): Promise<any> {
    return await this.get(this.getLandTransfersListKey(filters));
  }

  async cacheTransferHistory(
    landId: string,
    history: any,
    ttl: number = 900,
  ): Promise<void> {
    await this.set(this.getTransferHistoryKey(landId), history, ttl);
  }

  async getCachedTransferHistory(landId: string): Promise<any> {
    return await this.get(this.getTransferHistoryKey(landId));
  }

  async invalidateTransferHistory(landId: string): Promise<void> {
    await this.del(this.getTransferHistoryKey(landId));
  }

  async cacheTransferStats(
    period: string,
    stats: any,
    ttl: number = 1800,
  ): Promise<void> {
    await this.set(this.getTransferStatsKey(period), stats, ttl);
  }

  async getCachedTransferStats(period: string): Promise<any> {
    return await this.get(this.getTransferStatsKey(period));
  }

  async cacheUserTransfers(
    userId: string,
    transfers: any,
    ttl: number = 600,
  ): Promise<void> {
    await this.set(this.getUserTransfersKey(userId), transfers, ttl);
  }

  async getCachedUserTransfers(userId: string): Promise<any> {
    return await this.get(this.getUserTransfersKey(userId));
  }

  async invalidateUserTransfers(userId: string): Promise<void> {
    await this.del(this.getUserTransfersKey(userId));
  }

  async cacheDistrictTransfers(
    district: string,
    transfers: any,
    ttl: number = 1200,
  ): Promise<void> {
    await this.set(this.getDistrictTransfersKey(district), transfers, ttl);
  }

  async getCachedDistrictTransfers(district: string): Promise<any> {
    return await this.get(this.getDistrictTransfersKey(district));
  }

  async invalidateDistrictTransfers(district: string): Promise<void> {
    await this.del(this.getDistrictTransfersKey(district));
  }

  // Bulk invalidation methods
  async invalidateAllTransferCaches(): Promise<void> {
    // This would require a more sophisticated approach in production
    // For now, we'll reset all caches
    await this.reset();
  }

  async invalidateTransferCachesByPattern(pattern: string): Promise<void> {
    // In a production environment, you'd want to implement pattern-based deletion
    // This is a simplified approach
    await this.reset();
  }

  // Cache warming methods
  async warmTransferCache(transfers: any[]): Promise<void> {
    const promises = transfers.map((transfer) =>
      this.cacheLandTransfer(transfer.id, transfer, 1800),
    );
    await Promise.all(promises);
  }

  // Health check
  async isConnected(): Promise<boolean> {
    try {
      await this.set('health_check', 'ok', 60);
      const result = await this.get('health_check');
      await this.del('health_check');
      return result === 'ok';
    } catch (error) {
      return false;
    }
  }

  // Performance monitoring
  async getCacheStats(): Promise<any> {
    // This would depend on your Redis configuration
    // Placeholder for cache statistics
    return {
      connected: await this.isConnected(),
      timestamp: new Date().toISOString(),
    };
  }
}
