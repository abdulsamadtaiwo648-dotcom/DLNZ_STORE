import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCurrency, currencies, CurrencyCode } from './CurrencyContext';

interface ProductCurrencyDropdownProps {
  className?: string;
  darkBg?: boolean;
}

export const ProductCurrencyDropdown: React.FC<ProductCurrencyDropdownProps> = ({
  className,
  darkBg = true,
}) => {
  const { currencyCode, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (code: CurrencyCode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className || ''}`} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleToggle}
        className={`text-[8px] sm:text-[9px] font-technical-sm border transition-all duration-300 focus:outline-none cursor-pointer flex items-center gap-1 select-none px-2 py-0.5 tracking-wider uppercase h-6 ${
          darkBg
            ? 'text-white border-white/20 hover:border-brand-red/50 bg-black/60 hover:bg-black/90'
            : 'text-on-surface hover:text-white border-outline-variant/30 hover:border-brand-red/50 bg-[#0a0a0a] hover:bg-brand-charcoal'
        }`}
        title="Select Currency Protocol"
      >
        <span>{currencyCode}</span>
        <span className={`text-[6px] opacity-60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={`absolute right-0 mt-1 shadow-2xl z-50 flex flex-col border border-outline-variant/30 py-1 min-w-[70px] ${
              darkBg ? 'bg-[#0f0f0f]' : 'bg-[#0c0c0c]'
            }`}
          >
            {(Object.keys(currencies) as CurrencyCode[]).map((code) => (
              <button
                key={code}
                onClick={(e) => handleSelect(code, e)}
                className={`w-full text-left px-2 py-1 font-technical-sm text-[8px] uppercase tracking-wide transition-all duration-150 flex justify-between items-center cursor-pointer hover:bg-brand-red/25 ${
                  currencyCode === code ? 'text-brand-red font-bold bg-brand-red/10' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                <span>{code}</span>
                <span className="opacity-50 text-[7px]">{currencies[code].symbol}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
