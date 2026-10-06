import axios from 'axios';
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

export interface AiPlatformConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  preferredProvider: 'auto' | 'gemini' | 'openai';
  enableAiStudio: boolean;
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

export const DEFAULT_AI_CONFIG: AiPlatformConfig = {
  geminiApiKey: '',
  openaiApiKey: '',
  preferredProvider: 'auto',
  enableAiStudio: true,
};

const CONFIG_KEY = 'onboarding_config';
const CACHE_KEY = 'platform:onboarding_config';
const MEMORY_CACHE_KEY = 'config:onboarding';
const CACHE_TTL_SECONDS = 3600; // 1 hour in Redis

const AI_CONFIG_KEY = 'ai_config';
const AI_CACHE_KEY = 'platform:ai_config';
const AI_MEMORY_CACHE_KEY = 'config:ai';

function maskApiKey(key?: string): string {
  if (!key || key.trim().length === 0) return '';
  const clean = key.trim();
  if (clean.length <= 8) return '********';
  return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
}

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

  /**
   * Retrieves raw AI configuration (unmasked) for backend processing.
   */
  static async getRawAiConfig(): Promise<AiPlatformConfig> {
    return await MemoryCacheService.getOrSet(AI_MEMORY_CACHE_KEY, async () => {
      try {
        if (redisClient && redisClient.status === 'ready') {
          const cached = await redisClient.get(AI_CACHE_KEY).catch(() => null);
          if (cached) {
            return JSON.parse(cached) as AiPlatformConfig;
          }
        }
      } catch (cacheErr) {
        console.warn('[PlatformConfig:AI] Cache read skipped:', cacheErr);
      }

      try {
        const record = await (prisma as any).platformSetting.findUnique({
          where: { key: AI_CONFIG_KEY },
        });

        if (record && record.value) {
          const parsed = typeof record.value === 'string' ? JSON.parse(record.value) : record.value;
          const config: AiPlatformConfig = {
            ...DEFAULT_AI_CONFIG,
            ...parsed,
            updatedAt: record.updatedAt?.toISOString(),
            updatedBy: record.updatedBy || undefined,
          };

          try {
            if (redisClient && redisClient.status === 'ready') {
              await redisClient.setex(AI_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(config));
            }
          } catch {}

          return config;
        }

        // Check if environment variables have keys to seed initial DB config
        const envGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
        const envOpenAi = process.env.OPENAI_API_KEY || '';
        const initialConfig: AiPlatformConfig = {
          ...DEFAULT_AI_CONFIG,
          geminiApiKey: envGemini,
          openaiApiKey: envOpenAi,
        };

        const created = await (prisma as any).platformSetting.create({
          data: {
            key: AI_CONFIG_KEY,
            value: initialConfig as any,
            description: 'Platform AI Studio, Gemini and OpenAI LLM configurations',
            updatedBy: 'system',
          },
        });

        const finalConfig: AiPlatformConfig = {
          ...initialConfig,
          updatedAt: created.updatedAt?.toISOString(),
          updatedBy: 'system',
        };

        try {
          if (redisClient && redisClient.status === 'ready') {
            await redisClient.setex(AI_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(finalConfig));
          }
        } catch {}

        return finalConfig;
      } catch (dbErr) {
        console.error('[PlatformConfig:AI] Error reading from DB:', dbErr);
        return {
          ...DEFAULT_AI_CONFIG,
          geminiApiKey: process.env.GEMINI_API_KEY || '',
          openaiApiKey: process.env.OPENAI_API_KEY || '',
        };
      }
    }, 300);
  }

  /**
   * Retrieves AI configuration with masked keys for safe UI consumption.
   */
  static async getAiConfig(maskKeys = true): Promise<AiPlatformConfig & { hasGeminiKey: boolean; hasOpenAiKey: boolean }> {
    const raw = await this.getRawAiConfig();
    const hasGeminiKey = Boolean(raw.geminiApiKey && raw.geminiApiKey.trim().length > 0);
    const hasOpenAiKey = Boolean(raw.openaiApiKey && raw.openaiApiKey.trim().length > 0);

    return {
      ...raw,
      geminiApiKey: maskKeys ? maskApiKey(raw.geminiApiKey) : raw.geminiApiKey,
      openaiApiKey: maskKeys ? maskApiKey(raw.openaiApiKey) : raw.openaiApiKey,
      hasGeminiKey,
      hasOpenAiKey,
    };
  }

  /**
   * Updates AI platform settings.
   */
  static async updateAiConfig(
    updates: Partial<AiPlatformConfig>,
    updatedBy?: string
  ): Promise<AiPlatformConfig & { hasGeminiKey: boolean; hasOpenAiKey: boolean }> {
    const current = await this.getRawAiConfig();

    let newGeminiKey = current.geminiApiKey;
    if (updates.geminiApiKey !== undefined) {
      const gTrim = updates.geminiApiKey.trim();
      // If user passed a masked value like 'AQ.A...Xog' or '********', keep current
      if (!gTrim.includes('...') && gTrim !== '********') {
        newGeminiKey = gTrim;
      }
    }

    let newOpenAiKey = current.openaiApiKey;
    if (updates.openaiApiKey !== undefined) {
      const oTrim = updates.openaiApiKey.trim();
      if (!oTrim.includes('...') && oTrim !== '********') {
        newOpenAiKey = oTrim;
      }
    }

    const merged: AiPlatformConfig = {
      ...current,
      geminiApiKey: newGeminiKey,
      openaiApiKey: newOpenAiKey,
      preferredProvider: updates.preferredProvider || current.preferredProvider || 'auto',
      enableAiStudio: updates.enableAiStudio !== undefined ? Boolean(updates.enableAiStudio) : current.enableAiStudio,
      updatedBy: updatedBy || 'admin',
    };

    const saved = await (prisma as any).platformSetting.upsert({
      where: { key: AI_CONFIG_KEY },
      update: {
        value: merged as any,
        updatedBy: updatedBy || 'admin',
      },
      create: {
        key: AI_CONFIG_KEY,
        value: merged as any,
        description: 'Platform AI Studio, Gemini and OpenAI LLM configurations',
        updatedBy: updatedBy || 'admin',
      },
    });

    const finalConfig: AiPlatformConfig = {
      ...merged,
      updatedAt: saved.updatedAt?.toISOString(),
    };

    // Invalidate caches
    MemoryCacheService.invalidateKey(AI_MEMORY_CACHE_KEY);
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.setex(AI_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(finalConfig));
      }
    } catch {}

    return {
      ...finalConfig,
      geminiApiKey: maskApiKey(finalConfig.geminiApiKey),
      openaiApiKey: maskApiKey(finalConfig.openaiApiKey),
      hasGeminiKey: Boolean(finalConfig.geminiApiKey && finalConfig.geminiApiKey.trim().length > 0),
      hasOpenAiKey: Boolean(finalConfig.openaiApiKey && finalConfig.openaiApiKey.trim().length > 0),
    };
  }

  /**
   * Deep Diagnostic Test for Gemini or OpenAI API Key and Quota/Billing Status.
   * Reports exact issues: invalid keys, zero credit balance, free-tier limits, or full readiness.
   */
  static async testAiConnection(
    provider: 'gemini' | 'openai',
    testKey?: string
  ): Promise<{
    success: boolean;
    status: 'READY' | 'WARNING' | 'ERROR';
    code: string;
    issueCategory: 'HEALTHY' | 'COST_OR_BALANCE' | 'AUTHENTICATION' | 'INTERNAL_PROVIDER_ERROR' | 'PERMISSION_OR_REGION' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
    headline: string;
    summary: string;
    actionRequired?: string;
    details: {
      provider: 'gemini' | 'openai';
      textVisionStatus?: 'CONNECTED' | 'FAILED' | 'SKIPPED';
      imageGenStatus?: 'READY' | 'QUOTA_ZERO_FREE_TIER' | 'INSUFFICIENT_FUNDS' | 'FAILED';
      modelCount?: number;
      sampleModels?: string[];
      rawError?: string;
      rawCode?: number | string;
      helpUrl?: string;
    };
  }> {
    const raw = await this.getRawAiConfig();
    const effectiveKey = (testKey && testKey.trim().length > 0 && !testKey.includes('...'))
      ? testKey.trim()
      : (provider === 'gemini' ? (raw.geminiApiKey || process.env.GEMINI_API_KEY) : (raw.openaiApiKey || process.env.OPENAI_API_KEY));

    if (!effectiveKey) {
      return {
        success: false,
        status: 'ERROR',
        code: 'KEY_MISSING',
        issueCategory: 'AUTHENTICATION',
        headline: `No ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key Configured`,
        summary: `Please enter a valid ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API key to run connection diagnostics.`,
        actionRequired: provider === 'gemini' 
          ? 'Generate an API key from https://aistudio.google.com/app/apikey and paste it here.'
          : 'Generate a Secret Key from https://platform.openai.com/api-keys and paste it here.',
        details: {
          provider,
          textVisionStatus: 'SKIPPED',
          imageGenStatus: 'FAILED',
        },
      };
    }

    if (provider === 'gemini') {
      let modelCount = 0;
      let sampleModels: string[] = [];

      // Step 1: Test Key & Model Listing
      try {
        const res = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`,
          { timeout: 12000 }
        );
        const models: string[] = res.data?.models?.map((m: any) => m.name.replace('models/', '')) || [];
        modelCount = models.length;
        sampleModels = models.slice(0, 5);
      } catch (err: any) {
        const status = err?.response?.status;
        const errorData = err?.response?.data?.error;
        const msg = errorData?.message || err?.message || 'Connection failed';
        const codeStr = errorData?.status || String(status || err?.code || 'UNKNOWN');

        // Internal Server Error from Google (HTTP 500, 502, 503, 504)
        if (status && status >= 500) {
          return {
            success: false,
            status: 'ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            issueCategory: 'INTERNAL_PROVIDER_ERROR',
            headline: `Google Internal Server Error (HTTP ${status})`,
            summary: `Google AI Studio's servers experienced an internal problem or temporary outage: "${msg}"`,
            actionRequired: 'This is an internal issue on Google’s infrastructure. Wait a few moments and retry, or check Google Cloud Status.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
              helpUrl: 'https://status.cloud.google.com/',
            },
          };
        }

        // Invalid API Key (HTTP 400 with API_KEY_INVALID)
        if (status === 400 || msg.toLowerCase().includes('api_key_invalid') || msg.toLowerCase().includes('not valid')) {
          return {
            success: false,
            status: 'ERROR',
            code: 'INVALID_API_KEY',
            issueCategory: 'AUTHENTICATION',
            headline: 'Invalid Google Gemini API Key',
            summary: 'Google AI Studio rejected this key as invalid, incorrect, or malformed.',
            actionRequired: 'Please copy the complete, unedited API key directly from https://aistudio.google.com/app/apikey.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
              helpUrl: 'https://aistudio.google.com/app/apikey',
            },
          };
        }

        // Permission Denied or API Disabled (HTTP 403)
        if (status === 403) {
          return {
            success: false,
            status: 'ERROR',
            code: 'PERMISSION_DENIED',
            issueCategory: 'PERMISSION_OR_REGION',
            headline: 'Permission Denied / API Disabled (HTTP 403)',
            summary: `The API key was recognized, but the Generative Language API is disabled or blocked for this Google Cloud Project: "${msg}"`,
            actionRequired: 'Enable "Generative Language API" in Google Cloud Console or create a new key under a fresh Google AI Studio project.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
            },
          };
        }

        // Network / Timeout Error
        if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND' || err?.code === 'ETIMEDOUT') {
          return {
            success: false,
            status: 'ERROR',
            code: 'NETWORK_ERROR',
            issueCategory: 'NETWORK',
            headline: `Network Connection Error (${err.code})`,
            summary: `Could not reach Google Generative AI servers from backend host: ${msg}`,
            actionRequired: 'Check the server’s internet connection, outbound firewall, or DNS resolution.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: err.code,
            },
          };
        }

        return {
          success: false,
          status: 'ERROR',
          code: 'CONNECTION_FAILED',
          issueCategory: 'UNKNOWN',
          headline: `Gemini API Error (HTTP ${status || 'Network'})`,
          summary: msg,
          actionRequired: 'Check your API configuration and internet connection.',
          details: {
            provider: 'gemini',
            textVisionStatus: 'FAILED',
            imageGenStatus: 'FAILED',
            rawError: msg,
            rawCode: status || codeStr,
          },
        };
      }

      // Step 2: Test Text / Vision Model
      try {
        await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${effectiveKey}`,
          { contents: [{ role: 'user', parts: [{ text: 'healthcheck' }] }] },
          { headers: { 'Content-Type': 'application/json' }, timeout: 12000 }
        );
      } catch (textErr: any) {
        const status = textErr?.response?.status;
        const msg = textErr?.response?.data?.error?.message || textErr?.message || '';

        if (status && status >= 500) {
          return {
            success: false,
            status: 'ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            issueCategory: 'INTERNAL_PROVIDER_ERROR',
            headline: `Google Internal Server Error (HTTP ${status})`,
            summary: `Google Generative AI service reported an internal failure during vision text verification: "${msg}"`,
            actionRequired: 'Wait a few moments and retry, or check Google Cloud Service Health.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
              helpUrl: 'https://status.cloud.google.com/',
            },
          };
        }

        if (status === 429) {
          return {
            success: false,
            status: 'ERROR',
            code: 'RATE_LIMIT_EXCEEDED',
            issueCategory: 'RATE_LIMIT',
            headline: 'Gemini Text Quota Exceeded (HTTP 429)',
            summary: `Request rate limit (e.g. 15 requests per minute) or daily token quota reached: "${msg}"`,
            actionRequired: 'Wait 60 seconds and retry, or upgrade quota limits in Google Cloud Console.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
            },
          };
        }
      }

      // Step 3: Test Image Generation Quota (Crucial for AI Studio)
      try {
        await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${effectiveKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: 'minimal test' }] }],
            generationConfig: { responseModalities: ['IMAGE'] },
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
        );

        // Real image generation is fully active!
        return {
          success: true,
          status: 'READY',
          code: 'ALL_SYSTEMS_GO',
          issueCategory: 'HEALTHY',
          headline: 'Gemini Fully Operational (Vision & Studio Images Active)',
          summary: `Connected to Google AI Studio with ${modelCount} models. Both text taxonomy planning and photorealistic image synthesis are active!`,
          details: {
            provider: 'gemini',
            textVisionStatus: 'CONNECTED',
            imageGenStatus: 'READY',
            modelCount,
            sampleModels,
          },
        };
      } catch (imgErr: any) {
        const status = imgErr?.response?.status;
        const errorData = imgErr?.response?.data?.error;
        const msg = errorData?.message || imgErr?.message || '';

        // Internal Server Error on image model
        if (status && status >= 500) {
          return {
            success: true,
            status: 'WARNING',
            code: 'PROVIDER_INTERNAL_ERROR',
            issueCategory: 'INTERNAL_PROVIDER_ERROR',
            headline: `Google Internal Issue on Image Synthesis (HTTP ${status})`,
            summary: `Vision analysis works, but Gemini image synthesis model returned an internal error: "${msg}"`,
            actionRequired: 'Google AI Studio image servers may be experiencing temporary downtime. Retry shortly.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'CONNECTED',
              imageGenStatus: 'FAILED',
              modelCount,
              sampleModels,
              rawError: msg,
              rawCode: status,
              helpUrl: 'https://status.cloud.google.com/',
            },
          };
        }

        // Cost / Quota issue: Free Tier limit: 0 or ResourceExhausted
        if (status === 429 || msg.includes('limit: 0') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('resource_exhausted')) {
          return {
            success: true,
            status: 'WARNING',
            code: 'FREE_TIER_IMAGE_LIMIT_ZERO',
            issueCategory: 'COST_OR_BALANCE',
            headline: 'Cost/Quota Notice: Image Quota 0 (Free Tier Project)',
            summary: `Google Gemini text vision analysis & taxonomy works 100%. However, this Google project has no billing attached, so image models have a quota limit of 0. Exact provider message: "${msg}"`,
            actionRequired: 'To enable full photorealistic AI studio generation, attach a Google Cloud Billing account (Pay-as-you-go) in Google AI Studio, or add an OpenAI API key for DALL-E 3. Until billing is attached, the studio will use adaptive camera framing crops.',
            details: {
              provider: 'gemini',
              textVisionStatus: 'CONNECTED',
              imageGenStatus: 'QUOTA_ZERO_FREE_TIER',
              modelCount,
              sampleModels,
              rawError: msg,
              rawCode: status || 429,
              helpUrl: 'https://aistudio.google.com',
            },
          };
        }

        return {
          success: true,
          status: 'WARNING',
          code: 'IMAGE_SYNTHESIS_NOTICE',
          issueCategory: 'UNKNOWN',
          headline: 'Vision Connected • Image Model Warning',
          summary: `Gemini vision models connected, but image generation returned: ${msg}`,
          actionRequired: 'Attach a billing account to your project on Google AI Studio to unlock image models.',
          details: {
            provider: 'gemini',
            textVisionStatus: 'CONNECTED',
            imageGenStatus: 'FAILED',
            modelCount,
            sampleModels,
            rawError: msg,
            rawCode: status,
          },
        };
      }
    } else {
      // Provider: OpenAI
      try {
        const res = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${effectiveKey}` },
          timeout: 12000,
        });

        const models: string[] = res.data?.data?.map((m: any) => m.id) || [];
        const hasDalle = models.some((m) => m.includes('dall-e'));

        // Test a minimal 1-token chat completion to verify whether the account has positive credit balance
        try {
          await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: 'hi' }],
              max_tokens: 1,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${effectiveKey}`,
              },
              timeout: 12000,
            }
          );

          return {
            success: true,
            status: 'READY',
            code: 'ALL_SYSTEMS_GO',
            issueCategory: 'HEALTHY',
            headline: 'OpenAI Fully Operational & Funded (DALL-E 3 Ready)',
            summary: `OpenAI account verified with positive credit balance. Access to ${models.length} models, including DALL-E 3 commercial photography rendering!`,
            details: {
              provider: 'openai',
              textVisionStatus: 'CONNECTED',
              imageGenStatus: 'READY',
              modelCount: models.length,
            },
          };
        } catch (chatErr: any) {
          const chatStatus = chatErr?.response?.status;
          const chatError = chatErr?.response?.data?.error;
          const chatCode = chatError?.code || '';
          const chatMsg = chatError?.message || chatErr?.message || '';

          // Internal Server Error from OpenAI (HTTP 500, 502, 503)
          if (chatStatus && chatStatus >= 500) {
            return {
              success: false,
              status: 'ERROR',
              code: 'INTERNAL_SERVER_ERROR',
              issueCategory: 'INTERNAL_PROVIDER_ERROR',
              headline: `OpenAI Internal Server Error (HTTP ${chatStatus})`,
              summary: `OpenAI’s servers experienced an internal error: "${chatMsg}"`,
              actionRequired: 'This is an internal OpenAI service disruption. Check https://status.openai.com and retry later.',
              details: {
                provider: 'openai',
                textVisionStatus: 'FAILED',
                imageGenStatus: 'FAILED',
                rawError: chatMsg,
                rawCode: chatStatus,
                helpUrl: 'https://status.openai.com',
              },
            };
          }

          // If insufficient balance / quota on OpenAI (Cost issue)
          if (chatStatus === 429 || chatCode === 'insufficient_quota' || chatMsg.toLowerCase().includes('quota') || chatMsg.toLowerCase().includes('billing')) {
            return {
              success: false,
              status: 'ERROR',
              code: 'INSUFFICIENT_BALANCE',
              issueCategory: 'COST_OR_BALANCE',
              headline: 'Cost/Balance Issue: Insufficient OpenAI Credits ($0 Balance)',
              summary: `The OpenAI API key is valid, but your OpenAI account has zero remaining credit balance or an expired grant. Exact provider message: "${chatMsg}"`,
              actionRequired: 'Add a credit balance (e.g. $5 - $10) at https://platform.openai.com/settings/organization/billing to enable image generation.',
              details: {
                provider: 'openai',
                textVisionStatus: 'FAILED',
                imageGenStatus: 'INSUFFICIENT_FUNDS',
                rawError: chatMsg,
                rawCode: chatCode || 'insufficient_quota',
                helpUrl: 'https://platform.openai.com/settings/organization/billing',
              },
            };
          }

          return {
            success: true,
            status: 'WARNING',
            code: 'OPENAI_NOTICE',
            issueCategory: 'UNKNOWN',
            headline: 'OpenAI Key Valid • Model Notice',
            summary: `OpenAI authenticated, but test completion returned: ${chatMsg}`,
            details: {
              provider: 'openai',
              textVisionStatus: 'CONNECTED',
              imageGenStatus: hasDalle ? 'READY' : 'FAILED',
              modelCount: models.length,
              rawError: chatMsg,
              rawCode: chatStatus,
            },
          };
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const errorData = err?.response?.data?.error;
        const msg = errorData?.message || err?.message || 'Connection failed';
        const code = errorData?.code || '';

        // Internal Server Error from OpenAI
        if (status && status >= 500) {
          return {
            success: false,
            status: 'ERROR',
            code: 'INTERNAL_SERVER_ERROR',
            issueCategory: 'INTERNAL_PROVIDER_ERROR',
            headline: `OpenAI Internal Server Error (HTTP ${status})`,
            summary: `OpenAI servers returned an internal error: "${msg}"`,
            actionRequired: 'OpenAI is experiencing internal server issues. Check https://status.openai.com.',
            details: {
              provider: 'openai',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
              helpUrl: 'https://status.openai.com',
            },
          };
        }

        // Invalid API Key
        if (status === 401 || code === 'invalid_api_key' || msg.toLowerCase().includes('invalid api key')) {
          return {
            success: false,
            status: 'ERROR',
            code: 'INVALID_API_KEY',
            issueCategory: 'AUTHENTICATION',
            headline: 'Invalid OpenAI API Key',
            summary: 'OpenAI rejected this secret key as invalid, incorrect, or revoked.',
            actionRequired: 'Generate a new Secret Key at https://platform.openai.com/api-keys.',
            details: {
              provider: 'openai',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: status,
              helpUrl: 'https://platform.openai.com/api-keys',
            },
          };
        }

        // Insufficient balance / quota
        if (status === 429 || code === 'insufficient_quota' || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('billing')) {
          return {
            success: false,
            status: 'ERROR',
            code: 'INSUFFICIENT_BALANCE',
            issueCategory: 'COST_OR_BALANCE',
            headline: 'Cost/Balance Issue: Insufficient OpenAI Credits ($0 Balance)',
            summary: `Your OpenAI account has run out of credits or has zero balance. Exact message: "${msg}"`,
            actionRequired: 'Add credit balance at https://platform.openai.com/settings/organization/billing.',
            details: {
              provider: 'openai',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'INSUFFICIENT_FUNDS',
              rawError: msg,
              rawCode: code || 'insufficient_quota',
              helpUrl: 'https://platform.openai.com/settings/organization/billing',
            },
          };
        }

        // Network / Timeout
        if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND' || err?.code === 'ETIMEDOUT') {
          return {
            success: false,
            status: 'ERROR',
            code: 'NETWORK_ERROR',
            issueCategory: 'NETWORK',
            headline: `Network Connection Error (${err.code})`,
            summary: `Could not reach OpenAI servers from backend host: ${msg}`,
            actionRequired: 'Check the server’s internet connection or firewall.',
            details: {
              provider: 'openai',
              textVisionStatus: 'FAILED',
              imageGenStatus: 'FAILED',
              rawError: msg,
              rawCode: err.code,
            },
          };
        }

        return {
          success: false,
          status: 'ERROR',
          code: 'CONNECTION_FAILED',
          issueCategory: 'UNKNOWN',
          headline: `OpenAI API Error (HTTP ${status || 'Network'})`,
          summary: msg,
          actionRequired: 'Check your internet connection or OpenAI platform status.',
          details: {
            provider: 'openai',
            textVisionStatus: 'FAILED',
            imageGenStatus: 'FAILED',
            rawError: msg,
            rawCode: status,
          },
        };
      }
    }
  }
}
