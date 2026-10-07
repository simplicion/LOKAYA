'use client';

/**
 * 180 Core SDK Client Adapter for Lokaya
 * Provides type-safe wrappers for 180 Identity (SSO/Auth) and 180 Pay (Universal Checkout)
 */

export interface OneEightyAuthResult {
  code?: string;
  authToken?: string;
  accessToken?: string;
  user?: any;
  state?: string;
}

export interface OneEightyPayResult {
  sessionId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  isFree?: boolean;
}

/**
 * Resolves the 180 Identity global instance across known global identifiers
 */
export function getOneEightyAuthInstance(): any {
  if (typeof window === 'undefined') return null;
  const instance =
    (window as any).OneEightyIdentity ||
    (window as any).OneEightyAuth ||
    (window as any).OneEighty?.auth ||
    (window as any).OneEightyCore?.auth ||
    null;

  if (instance) {
    (window as any).OneEightyAuth = instance;
    (window as any).OneEightyIdentity = instance;
  }
  return instance;
}

/**
 * Resolves the 180 Pay global instance across known global identifiers
 */
export function getOneEightyPayInstance(): any {
  if (typeof window === 'undefined') return null;
  const instance =
    (window as any).OneEightyPay ||
    (window as any).OneEighty?.pay ||
    (window as any).OneEightyCore?.pay ||
    null;

  if (instance) {
    (window as any).OneEightyPay = instance;
  }
  return instance;
}

/**
 * Helper to ensure the 180 Core SDK is loaded
 */
export async function ensure180SdkLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (getOneEightyAuthInstance()) return true;

  // If script not present, load from local bundle with CDN fallback
  const existing = document.querySelector('script[src*="180-core-sdk.js"]');
  if (!existing) {
    const script = document.createElement('script');
    script.src = '/180-core-sdk.js';
    script.async = true;
    script.onerror = () => {
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://auth.180workspace.com/sdk/v1/180-core-sdk.js';
      fallbackScript.async = true;
      document.body.appendChild(fallbackScript);
    };
    document.body.appendChild(script);
  }

  // Poll for up to 4 seconds
  const start = Date.now();
  while (Date.now() - start < 4000) {
    if (getOneEightyAuthInstance()) {
      return true;
    }
    await new Promise((res) => setTimeout(res, 80));
  }

  return Boolean(getOneEightyAuthInstance());
}

/**
 * Triggers 180 Identity Authentication (Bottom Sheet or Popup)
 */
export async function triggerOneEightyLogin(options: {
  uxMode?: 'bottom_sheet' | 'popup' | 'full_page';
  redirectUri?: string;
  onSuccess: (data: OneEightyAuthResult) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}): Promise<void> {
  const loaded = await ensure180SdkLoaded();
  const auth = getOneEightyAuthInstance();
  if (!loaded || !auth) {
    throw new Error('180 Identity SDK failed to initialize');
  }

  const clientId = process.env.NEXT_PUBLIC_180_CLIENT_ID || '180_client_30e2f6a803c849fb213ce31cc7a7ec1f';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const uxMode = options.uxMode || 'bottom_sheet';

  let redirectUri = options.redirectUri;
  if (!redirectUri && typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      redirectUri = 'https://lokaya.shop';
    } else {
      redirectUri = `${origin}${window.location.pathname}`;
    }
  }

  const loginFn = auth.signIn || (window as any).OneEighty?.signIn || auth.openLoginPopup;

  if (typeof loginFn === 'function') {
    loginFn.call(auth, {
      clientId,
      redirectUri,
      scope: 'openid identity:read identity:email identity:phone',
      uxMode,
      environment: 'production',
      authServerUrl: process.env.NEXT_PUBLIC_180_AUTH_URL || 'https://profile.180workspace.com',
      onSuccess: options.onSuccess,
      onError: options.onError,
      onCancel: options.onCancel,
    });
  } else {
    throw new Error('180 Identity signIn method not found on window.OneEightyIdentity');
  }
}

/**
 * Triggers 180 Pay Universal Checkout Bottom Sheet
 */
export async function triggerOneEightyPay(options: {
  amount: number;
  currency?: string;
  title?: string;
  description?: string;
  sessionId: string;
  planCode?: string;
  onSuccess: (result: OneEightyPayResult) => void;
  onError?: (err: any) => void;
  onCancel?: () => void;
}): Promise<void> {
  const loaded = await ensure180SdkLoaded();
  const pay = getOneEightyPayInstance();
  if (!loaded || !pay) {
    throw new Error('180 Pay SDK failed to initialize');
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const checkoutFn = pay.openBottomSheet || pay.checkout || pay.openCheckoutModal;

  if (typeof checkoutFn === 'function') {
    checkoutFn.call(pay, {
      amount: options.amount,
      currency: options.currency || 'NPR',
      title: options.title || 'Lokaya Checkout',
      description: options.description || 'Universal Card Payment via 180 Pay',
      sessionId: options.sessionId,
      planCode: options.planCode,
      uxMode: isMobile ? 'bottom_sheet' : 'bottom_sheet',
      environment: 'production',
      onSuccess: options.onSuccess,
      onError: options.onError,
      onCancel: options.onCancel,
    });
  } else {
    throw new Error('180 Pay checkout method not found on window.OneEightyPay');
  }
}
