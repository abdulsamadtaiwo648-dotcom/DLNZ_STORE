import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyDetails {
  code: CurrencyCode;
  symbol: string;
  rate: number; // multiplier from base NGN price
  label: string;
}

export const currencies: Record<CurrencyCode, CurrencyDetails> = {
  NGN: { code: 'NGN', symbol: '₦', rate: 1, label: 'NGN (₦)' },
  USD: { code: 'USD', symbol: '$', rate: 1 / 1500, label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', rate: 1 / 1600, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rate: 1 / 1900, label: 'GBP (£)' },
};

interface CurrencyContextType {
  currencyCode: CurrencyCode;
  selectedCurrency: CurrencyDetails;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (priceNgn: number) => string;
  convertPrice: (priceNgn: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('dlnz_currency');
    if (saved && (saved === 'NGN' || saved === 'USD' || saved === 'EUR' || saved === 'GBP')) {
      return saved;
    }
    return 'NGN';
  });

  const selectedCurrency = currencies[currencyCode];

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyCodeState(code);
    localStorage.setItem('dlnz_currency', code);
  };

  const convertPrice = (priceNgn: number) => {
    return priceNgn * selectedCurrency.rate;
  };

  const formatPrice = (priceNgn: number) => {
    const converted = convertPrice(priceNgn);
    if (currencyCode === 'NGN') {
      return `₦ ${Math.round(converted).toLocaleString()}`;
    }
    // High-end luxury standard formats decimals cleanly or as a rounded premium price
    return `${selectedCurrency.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currencyCode, selectedCurrency, setCurrency, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
