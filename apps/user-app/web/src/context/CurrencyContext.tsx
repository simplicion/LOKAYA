'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocationService, LocationContext } from '../lib/services/location.service';

export interface CurrencyContextType {
  currency: string; // e.g. "INR", "NPR", "USD"
  currencySymbol: string; // e.g. "₹", "रू", "$"
  countryCode: string; // e.g. "IN", "NP", "US"
  countryName: string;
  flag: string;
  rates: Record<string, number>;
  isLoading: boolean;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number | null | undefined, fromCurrency?: string) => string;
  convertPrice: (amount: number | null | undefined, fromCurrency?: string) => number;
  isIndianUser: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  currencySymbol: '₹',
  countryCode: 'IN',
  countryName: 'India',
  flag: '🇮🇳',
  rates: { INR: 1.0, NPR: 1.6, USD: 0.0104 },
  isLoading: true,
  setCurrency: () => {},
  formatPrice: (amt) => `₹${amt || 0}`,
  convertPrice: (amt) => amt || 0,
  isIndianUser: true,
});

const DEFAULT_RATES: Record<string, number> = {
  INR: 1.0,
  NPR: 1.6,
  USD: 0.0104,
  EUR: 0.0091,
  GBP: 0.0078,
  AED: 0.0382,
  CAD: 0.0145,
  AUD: 0.0162,
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [countryCode, setCountryCode] = useState<string>('IN');
  const [countryName, setCountryName] = useState<string>('India');
  const [flag, setFlag] = useState<string>('🇮🇳');
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Fetch live rates from backend meta API or public fallback
  const fetchLiveRates = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
      const res = await fetch(`${apiUrl}/api/v1/meta/currency-rates?base=INR`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
          return data.rates;
        }
      }
    } catch {
      // Direct live fallback if backend is warming up
      try {
        const directRes = await fetch('https://open.er-api.com/v6/latest/INR');
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData?.rates) {
            setRates(directData.rates);
            return directData.rates;
          }
        }
      } catch {}
    }
    return DEFAULT_RATES;
  };

  // 2. Initialize location and currency on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      await fetchLiveRates();

      try {
        const loc: LocationContext = await LocationService.detectUserLocation();
        if (isMounted && loc) {
          const userCurrency = loc.currency || 'INR';
          const userCountry = loc.countryCode || 'IN';
          const symbol = LocationService.getCurrencySymbol(userCurrency, userCountry);

          setCurrencyState(userCurrency);
          setCurrencySymbol(symbol || (userCurrency === 'NPR' ? 'रू' : userCurrency === 'INR' ? '₹' : '$'));
          setCountryCode(userCountry);
          setCountryName(loc.country || 'India');
          setFlag(loc.flag || '🇮🇳');
        }
      } catch (err) {
        console.warn('[CurrencyContext] Location detection fallback to default:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. User manual currency change handler
  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase();
    setCurrencyState(upper);
    const symbol = LocationService.getCurrencySymbol(upper);
    setCurrencySymbol(symbol || upper);
    try {
      localStorage.setItem('lokaya_preferred_currency', upper);
    } catch {}
  }, []);

  // 4. Convert price numeric calculation
  const convertPrice = useCallback(
    (amount: number | null | undefined, fromCurrency = 'INR'): number => {
      if (amount === null || amount === undefined || isNaN(amount)) return 0;
      const from = fromCurrency.toUpperCase();
      const to = currency.toUpperCase();

      if (from === to) return amount;

      const fromRate = rates[from] || 1.0;
      const toRate = rates[to] || 1.0;
      const exchangeRate = toRate / fromRate;

      return Math.round(amount * exchangeRate * 100) / 100;
    },
    [currency, rates]
  );

  // 5. Presentment Formatter for UI
  const formatPrice = useCallback(
    (amount: number | null | undefined, fromCurrency = 'INR'): string => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return `${currencySymbol}0`;
      }

      const converted = convertPrice(amount, fromCurrency);

      // Clean integer formatting for INR and NPR retail norms
      if (currency === 'INR' || currency === 'NPR') {
        const rounded = Math.round(converted);
        return `${currencySymbol}${rounded.toLocaleString('en-IN')}`;
      }

      // 2 decimal places for USD, EUR, GBP, etc.
      return `${currencySymbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currency, currencySymbol, convertPrice]
  );

  const isIndianUser = countryCode === 'IN' || countryName.toLowerCase() === 'india';

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        countryCode,
        countryName,
        flag,
        rates,
        isLoading,
        setCurrency,
        formatPrice,
        convertPrice,
        isIndianUser,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
