'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  rates: Record<string, number>;
  isLoading: boolean;
  setCurrency: (currency: string, symbol?: string) => void;
  convertPrice: (amount: number | null | undefined, fromCurrency?: string) => number;
  formatPrice: (amount: number | null | undefined, fromCurrency?: string) => string;
}

const DEFAULT_RATES: Record<string, number> = {
  INR: 1.0,
  NPR: 1.6,
  USD: 0.0104,
  EUR: 0.0096,
  GBP: 0.0083
};

const SYMBOL_MAP: Record<string, string> = {
  INR: '₹',
  NPR: 'रू',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  currencySymbol: '₹',
  rates: DEFAULT_RATES,
  isLoading: false,
  setCurrency: () => {},
  convertPrice: (amt) => amt || 0,
  formatPrice: (amt) => `₹${amt || 0}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
        const baseUrl = rawApiUrl.replace(/\/api\/v1\/?$/, '');
        const res = await fetch(`${baseUrl}/api/v1/meta/currency-rates?base=INR`);
        if (res.ok) {
          const data = await res.json();
          if (data?.rates) {
            setRates(data.rates);
          } else if (data?.data?.rates) {
            setRates(data.data.rates);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic Forex rates in Admin, using fallback matrix:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCurrency = useCallback((newCurrency: string, newSymbol?: string) => {
    const curr = newCurrency.toUpperCase();
    setCurrencyState(curr);
    setCurrencySymbol(newSymbol || SYMBOL_MAP[curr] || curr);
  }, []);

  const convertPrice = useCallback(
    (amount: number | null | undefined, fromCurrency = 'INR'): number => {
      if (amount === null || amount === undefined || isNaN(amount)) return 0;
      if (fromCurrency === currency) return amount;

      const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1.0;
      const toRate = rates[currency] || DEFAULT_RATES[currency] || 1.0;

      const inBase = amount / fromRate;
      return inBase * toRate;
    },
    [currency, rates]
  );

  const formatPrice = useCallback(
    (amount: number | null | undefined, fromCurrency = 'INR'): string => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return `${currencySymbol}0`;
      }
      const converted = convertPrice(amount, fromCurrency);
      if (currency === 'INR' || currency === 'NPR') {
        return `${currencySymbol}${Math.round(converted).toLocaleString()}`;
      }
      return `${currencySymbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [convertPrice, currency, currencySymbol]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        rates,
        isLoading,
        setCurrency,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
