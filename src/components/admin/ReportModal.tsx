import React, { useState, useMemo } from 'react';
import { X, Download, Calendar, BarChart3, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { Order } from '../../types';
import { useCurrency } from '../CurrencyContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, orders }) => {
  const { formatPrice, selectedCurrency } = useCurrency();

  // Helper to parse dates uniformly
  const parseOrderDate = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return (dateString: string) => {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return {
          monthIndex: d.getMonth(),
          year: d.getFullYear(),
          monthName: months[d.getMonth()]
        };
      }
      
      const cleanStr = (dateString || "").trim();
      const yearMatch = cleanStr.match(/\b(20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
      
      let monthIndex = 0;
      for (let i = 0; i < months.length; i++) {
        if (cleanStr.toLowerCase().includes(months[i].toLowerCase())) {
          monthIndex = i;
          break;
        }
      }
      return { monthIndex, year, monthName: months[monthIndex] };
    };
  }, []);

  // Compute available years dynamically from actual order logs
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    // Default to adding current year in case collection is empty
    years.add(new Date().getFullYear());
    
    orders.forEach(o => {
      if (o.date) {
        const { year } = parseOrderDate(o.date);
        years.add(year);
      }
    });
    
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  }, [orders, parseOrderDate]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return availableYears[0] || new Date().getFullYear();
  });

  // Filter orders by chosen year
  const yearOrders = useMemo(() => {
    return orders.filter(o => o.date && parseOrderDate(o.date).year === selectedYear);
  }, [orders, selectedYear, parseOrderDate]);

  // Annual metrics computations
  const annualMetrics = useMemo(() => {
    const validOrders = yearOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Hold');
    const totalVolume = validOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const orderCount = yearOrders.length;
    const completedCount = yearOrders.filter(o => o.status === 'Delivered' || o.status === 'Shipped').length;
    const averageOrderValue = orderCount > 0 ? Math.round(totalVolume / orderCount) : 0;

    return {
      totalVolume,
      orderCount,
      completedCount,
      averageOrderValue
    };
  }, [yearOrders]);

  // Monthly breakdown for selected year
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlyBreakdown = useMemo(() => {
    return monthNames.map((mName, idx) => {
      const monthOrders = yearOrders.filter(o => {
        const { monthIndex } = parseOrderDate(o.date);
        return monthIndex === idx;
      });

      const validMonthOrders = monthOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Hold');
      const revenue = validMonthOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      return {
        monthIndex: idx,
        shortName: mName,
        fullName: fullMonthNames[idx],
        orderCount: monthOrders.length,
        revenue,
        hasData: monthOrders.length > 0
      };
    });
  }, [yearOrders, parseOrderDate]);

  // Escape fields for standard RFC-4180 CSV specifications
  const escapeCSV = (val: any) => {
    const str = String(val === undefined || val === null ? '' : val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Dispatch standard CSV Blob file downloads
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compile & Download Annual Statement
  const handleDownloadYearEnding = () => {
    let csv = `DRIVEN LIVES, NEW ZONE (DLNZ) - YEAR-ENDING STATEMENT (${selectedYear})\r\n`;
    csv += `Generated on,${escapeCSV(new Date().toLocaleString())}\r\n`;
    csv += `Auditing Currency System,${escapeCSV(selectedCurrency.code + ' (' + selectedCurrency.symbol + ')')}\r\n\r\n`;
    
    csv += `ANNUAL FINANCIAL METRICS\r\n`;
    csv += `Total Registered Transactions,${annualMetrics.orderCount}\r\n`;
    csv += `Completed / Fulfilled Shipments,${annualMetrics.completedCount}\r\n`;
    csv += `Total Base Gross Revenue (NGN),₦ ${annualMetrics.totalVolume.toLocaleString()}\r\n`;
    csv += `Total Converted Gross Revenue (${selectedCurrency.code}),${selectedCurrency.symbol} ${(annualMetrics.totalVolume * selectedCurrency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\r\n`;
    csv += `Average Order Value (Base NGN),₦ ${annualMetrics.averageOrderValue.toLocaleString()}\r\n\r\n`;
    
    csv += `MONTHLY REVENUE SUMMARY (${selectedYear})\r\n`;
    csv += `Month,Transactions Count,Gross Revenue (Base NGN),Converted Revenue (${selectedCurrency.code})\r\n`;
    
    monthlyBreakdown.forEach(m => {
      const convRev = m.revenue * selectedCurrency.rate;
      csv += `${escapeCSV(m.fullName)},${m.orderCount},"₦ ${m.revenue.toLocaleString()}","${selectedCurrency.symbol} ${convRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\r\n`;
    });
    
    csv += `\r\n`;
    csv += `ANNUAL TRANSACTION LEDGER\r\n`;
    csv += `Order ID,Date,Recipient Name,Customer Email,Status,Tracking ID,Base Revenue (NGN),Converted Revenue (${selectedCurrency.code})\r\n`;
    
    yearOrders.forEach(o => {
      const convAmount = (o.amount || 0) * selectedCurrency.rate;
      csv += `${escapeCSV(o.id)},${escapeCSV(o.date)},${escapeCSV(o.customerName)},${escapeCSV(o.customerEmail)},${escapeCSV(o.status)},${escapeCSV(o.tracking || 'PENDING')},"₦ ${(o.amount || 0).toLocaleString()}","${selectedCurrency.symbol} ${convAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\r\n`;
    });
    
    downloadCSV(`DLNZ_YearEnding_Statement_${selectedYear}.csv`, csv);
  };

  // Compile & Download Single Month Statement
  const handleDownloadMonthly = (monthIdx: number, monthName: string) => {
    const monthOrders = yearOrders.filter(o => parseOrderDate(o.date).monthIndex === monthIdx);
    const targetMetrics = monthlyBreakdown[monthIdx];
    const targetRevenueConverted = targetMetrics.revenue * selectedCurrency.rate;
    const targetAov = monthOrders.length > 0 ? Math.round(targetMetrics.revenue / monthOrders.length) : 0;

    let csv = `DRIVEN LIVES, NEW ZONE (DLNZ) - MONTHLY PERFORMANCE STATEMENT (${monthName.toUpperCase()} ${selectedYear})\r\n`;
    csv += `Generated on,${escapeCSV(new Date().toLocaleString())}\r\n`;
    csv += `Auditing Currency System,${escapeCSV(selectedCurrency.code + ' (' + selectedCurrency.symbol + ')')}\r\n\r\n`;
    
    csv += `MONTHLY CLOSE METRICS\r\n`;
    csv += `Reporting Period,${monthName} ${selectedYear}\r\n`;
    csv += `Total Transactions,${monthOrders.length}\r\n`;
    csv += `Total Gross Revenue (Base NGN),₦ ${targetMetrics.revenue.toLocaleString()}\r\n`;
    csv += `Converted Monthly Revenue (${selectedCurrency.code}),${selectedCurrency.symbol} ${targetRevenueConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\r\n`;
    csv += `Average Order Value (Base NGN),₦ ${targetAov.toLocaleString()}\r\n\r\n`;
    
    csv += `MONTHLY TRANSACTION REGISTER\r\n`;
    csv += `Order ID,Date,Recipient Name,Customer Email,Status,Tracking ID,Base Revenue (NGN),Converted Revenue (${selectedCurrency.code})\r\n`;
    
    monthOrders.forEach(o => {
      const convAmount = (o.amount || 0) * selectedCurrency.rate;
      csv += `${escapeCSV(o.id)},${escapeCSV(o.date)},${escapeCSV(o.customerName)},${escapeCSV(o.customerEmail)},${escapeCSV(o.status)},${escapeCSV(o.tracking || 'PENDING')},"₦ ${(o.amount || 0).toLocaleString()}","${selectedCurrency.symbol} ${convAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\r\n`;
    });
    
    downloadCSV(`DLNZ_Statement_${monthName}_${selectedYear}.csv`, csv);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-[#0a0a0a] border border-outline-variant/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 flex flex-col p-8 md:p-12 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-start pb-8 border-b border-outline-variant/20 mb-10">
          <div>
            <span className="font-technical-sm text-[9px] text-brand-red uppercase tracking-[0.25em] font-bold block mb-1">AUDIT SYSTEM PROTOCOL</span>
            <h2 className="font-display text-2xl md:text-4xl text-white uppercase tracking-tight">Ledger Statements</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 border border-outline-variant/20 text-[#666666] hover:text-white hover:border-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Controls: Year Selection */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-surface-container p-6 border border-outline-variant/20">
          <div>
            <label className="font-technical-sm text-[8px] uppercase tracking-widest opacity-40 block mb-2 font-bold">Select Audit Year</label>
            <div className="flex gap-2">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-4 py-2 font-technical-sm text-[10px] tracking-widest font-bold border transition-all cursor-pointer",
                    selectedYear === year 
                      ? "bg-white text-black border-white" 
                      : "bg-[#111111] text-white hover:border-[#444] border-outline-variant/30"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right">
            <span className="font-technical-sm text-[8px] uppercase tracking-widest opacity-40 block mb-1 font-bold">Current Audit Scope</span>
            <span className="font-display text-[#bbbbbb] uppercase text-sm block tracking-widest">
              JANUARY 1 - DECEMBER 31, {selectedYear}
            </span>
          </div>
        </div>

        {/* Bento Board: Annual Stats & Year Ending Export */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          
          {/* Key summaries */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-[#0f0f0f] border border-outline-variant/15 p-6 flex flex-col justify-between">
              <span className="font-technical-sm text-[8px] uppercase tracking-widest opacity-40">Gross Sales</span>
              <div className="mt-4">
                <p className="font-display text-xl text-white font-bold leading-none">
                  {formatPrice(annualMetrics.totalVolume)}
                </p>
                <p className="font-technical-sm text-[8.5px] opacity-25 mt-1.5 uppercase">Annual Aggregate</p>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-outline-variant/15 p-6 flex flex-col justify-between">
              <span className="font-technical-sm text-[8px] uppercase tracking-widest opacity-40">Transactions</span>
              <div className="mt-4">
                <p className="font-display text-xl text-white font-bold leading-none">
                  {annualMetrics.orderCount}
                </p>
                <p className="font-technical-sm text-[8.5px] opacity-25 mt-1.5 uppercase">Invoices Registered</p>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-outline-variant/15 p-6 flex flex-col justify-between">
              <span className="font-technical-sm text-[8px] uppercase tracking-widest opacity-40">Avg Order Value</span>
              <div className="mt-4">
                <p className="font-display text-xl text-white font-bold leading-none">
                  {formatPrice(annualMetrics.averageOrderValue)}
                </p>
                <p className="font-technical-sm text-[8.5px] opacity-25 mt-1.5 uppercase">Representative Mean</p>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-outline-variant/15 p-6 flex flex-col justify-between">
              <span className="font-technical-sm text-[8px] uppercase tracking-widest opacity-40">Fulfulled Ratio</span>
              <div className="mt-4">
                <p className="font-display text-xl text-green-550 font-bold leading-none">
                  {annualMetrics.orderCount > 0 
                    ? Math.round((annualMetrics.completedCount / annualMetrics.orderCount) * 100) 
                    : 0}%
                </p>
                <p className="font-technical-sm text-[8.5px] opacity-25 mt-1.5 uppercase">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Core Year-Ending Action (Direct Response to "Year Ending") */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#121212] to-[#0c0c0c] border border-outline-variant/25 p-8 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="font-technical-sm text-[9px] uppercase tracking-[0.2em] text-[#888888] font-bold">CLOSE FISCAL AUDITING</span>
                <Calendar className="w-5 h-5 text-brand-red opacity-60" />
              </div>
              <h3 className="font-display text-lg uppercase text-white mb-2 leading-tight">Year-Ending Ledger Statement</h3>
              <p className="text-[10px] text-primary/50 leading-relaxed font-body uppercase">
                Compile and output the entire audited transactions roster and month-to-month analytics summaries for the complete fiscal loop of {selectedYear}. Matches official high-end reporting frameworks.
              </p>
            </div>

            <button
              onClick={handleDownloadYearEnding}
              className="mt-8 bg-brand-red hover:bg-white text-white hover:text-black font-technical-sm text-[10px] uppercase tracking-widest font-bold py-4 px-6 flex items-center justify-center gap-3 transition-all cursor-pointer border border-brand-red/30 hover:border-white"
            >
              <Download className="w-4 h-4" />
              Download {selectedYear} Year-Ending Report
            </button>
          </div>
        </div>

        {/* 12-Month Close Ledger Grid (Direct Response to "All Month") */}
        <div>
          <div className="mb-6">
            <span className="font-technical-sm text-[10px] uppercase tracking-[0.3em] font-bold text-[#888] block">All Month Performance Sheets</span>
            <p className="text-[9px] uppercase text-primary/30 mt-1">Select and extract individual ledger sheets for any specific month</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthlyBreakdown.map((m) => (
              <div
                key={m.monthIndex}
                className={cn(
                  "border p-5 flex flex-col justify-between transition-all duration-300 relative group",
                  m.hasData 
                    ? "bg-[#0b0b0b] border-outline-variant/20 hover:border-brand-red/40" 
                    : "bg-[#050505] border-outline-variant/5 opacity-40"
                )}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-display text-sm font-bold uppercase tracking-widest text-[#dddddd] group-hover:text-brand-red transition-colors">
                      {m.fullName}
                    </span>
                    <span className="font-technical-sm text-[7.5px] uppercase opacity-35">
                      {selectedYear}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    {m.hasData ? (
                      <>
                        <p className="font-technical-sm text-[11px] text-[#e5e5e5] font-bold">
                          {formatPrice(m.revenue)}
                        </p>
                        <p className="font-technical-sm text-[8px] opacity-40 uppercase tracking-wider mt-1">
                          {m.orderCount} {m.orderCount === 1 ? 'Invoice' : 'Invoices'}
                        </p>
                      </>
                    ) : (
                      <p className="font-technical-sm text-[8px] opacity-30 uppercase tracking-widest mt-1">
                        No Sales Logged
                      </p>
                    )}
                  </div>
                </div>

                {m.hasData && (
                  <button
                    onClick={() => handleDownloadMonthly(m.monthIndex, m.shortName)}
                    className="mt-6 w-full py-2 bg-[#121212] hover:bg-brand-red text-white font-technical-sm text-[8.5px] uppercase tracking-widest border border-outline-variant/20 group-hover:border-brand-red/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title={`Export ${m.fullName} Report`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
