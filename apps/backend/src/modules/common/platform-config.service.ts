import { prisma } from '@workspace/db';
import { redisClient } from '../../shared/services/redis.service';
import { MemoryCacheService } from '../../shared/services/memory-cache.service';

export interface OnboardingConfig {
  requireSellerDocs: boolean;
  requireRiderDocs: boolean;
  autoApproveSeller: boolean;
  autoApproveRider: boolean;
  requireProductVerification: boolean;
  autoApproveProducts: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  requireSellerDocs: false,
  requireRiderDocs: false,
  autoApproveSeller: true,
  autoApproveRider: true,
  requireProductVerification: false,
  autoApproveProducts: true,
};

const CONFIG_KEY = 'onboarding_config';
const CACHE_KEY = 'platform:onboarding_config';
const MEMORY_CACHE_KEY = 'config:onboarding';
const CACHE_TTL_SECONDS = 3600; // 1 hour in Redis

export class PlatformConfigService {
  /**
   * Retrieves current onboarding configuration.
   * Priority: In-Memory L1 Cache -> Redis Cache -> Postgres DB -> Default Fallback.
   */
  static async getOnboardingConfig(): Promise<OnboardingConfig> {
    return await MemoryCacheService.getOrSet(MEMORY_CACHE_KEY, async () => {
      try {
        // 1. Check Redis cache
        if (redisClient && redisClient.status === 'ready') {
          const cached = await redisClient.get(CACHE_KEY).catch(() => null);
          if (cached) {
            return JSON.parse(cached) as OnboardingConfig;
          }
        }
      } catch (cacheErr) {
        console.warn('[PlatformConfig] Cache read skipped:', cacheErr);
      }

      try {
        // 2. Query Postgres
        const record = await (prisma as any).platformSetting.findUnique({
          where: { key: CONFIG_KEY }
        });

        if (record && record.value) {
          const parsed = typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
          const config: OnboardingConfig = {
            ...DEFAULT_ONBOARDING_CONFIG,
            ...parsed,
            updatedAt: record.updatedAt?.toISOString(),
            updatedBy: record.updatedBy || undefined,
          };

          // Cache result in Redis
          try {
            if (redisClient && redisClient.status === 'ready') {
              await redisClient.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(config));
            }
          } catch {}

          return config;
        }

        // 3. If no record yet, create default record in DB
        const created = await (prisma as any).platformSetting.create({
          data: {
            key: CONFIG_KEY,
            value: DEFAULT_ONBOARDING_CONFIG as any,
            description: 'Global onboarding KYC and automatic verification policy for Sellers and Delivery Riders',
            updatedBy: 'system'
          }
        });

        const initialConfig: OnboardingConfig = {
          ...DEFAULT_ONBOARDING_CONFIG,
          updatedAt: created.updatedAt?.toISOString(),
          updatedBy: 'system'
        };

        try {
          if (redisClient && redisClient.status === 'ready') {
            await redisClient.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(initialConfig));
          }
        } catch {}

        return initialConfig;
      } catch (dbErr) {
        console.error('[PlatformConfig] Failed to fetch onboarding config from DB:', dbErr);
        return DEFAULT_ONBOARDING_CONFIG;
      }
    }, 300);
  }

  /**
   * Updates the onboarding configuration and invalidates cache.
   */
  static async updateOnboardingConfig(
    updates: Partial<OnboardingConfig>,
    updatedBy?: string
  ): Promise<OnboardingConfig> {
    const current = await this.getOnboardingConfig();

    const merged: OnboardingConfig = {
      ...current,
      requireSellerDocs: updates.requireSellerDocs !== undefined 
        ? Boolean(updates.requireSellerDocs) 
        : current.requireSellerDocs,
      requireRiderDocs: updates.requireRiderDocs !== undefined 
        ? Boolean(updates.requireRiderDocs) 
        : current.requireRiderDocs,
      autoApproveSeller: updates.autoApproveSeller !== undefined
        ? Boolean(updates.autoApproveSeller)
        : (updates.requireSellerDocs !== undefined ? !updates.requireSellerDocs : current.autoApproveSeller),
      autoApproveRider: updates.autoApproveRider !== undefined
        ? Boolean(updates.autoApproveRider)
        : (updates.requireRiderDocs !== undefined ? !updates.requireRiderDocs : current.autoApproveRider),
      requireProductVerification: updates.requireProductVerification !== undefined
        ? Boolean(updates.requireProductVerification)
        : current.requireProductVerification,
      autoApproveProducts: updates.autoApproveProducts !== undefined
        ? Boolean(updates.autoApproveProducts)
        : (updates.requireProductVerification !== undefined ? !updates.requireProductVerification : current.autoApproveProducts),
      updatedBy: updatedBy || 'admin',
    };

    const saved = await (prisma as any).platformSetting.upsert({
      where: { key: CONFIG_KEY },
      update: {
        value: merged as any,
        updatedBy: updatedBy || 'admin'
      },
      create: {
        key: CONFIG_KEY,
        value: merged as any,
        description: 'Global onboarding KYC and automatic verification policy for Sellers and Delivery Riders',
        updatedBy: updatedBy || 'admin'
      }
    });

    const finalConfig: OnboardingConfig = {
      ...merged,
      updatedAt: saved.updatedAt?.toISOString(),
    };

    // Invalidate L1 memory cache & Redis
    MemoryCacheService.invalidateKey(MEMORY_CACHE_KEY);
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(finalConfig));
      }
    } catch (cacheErr) {
      console.warn('[PlatformConfig] Cache invalidation skipped:', cacheErr);
    }

    return finalConfig;
  }
}
