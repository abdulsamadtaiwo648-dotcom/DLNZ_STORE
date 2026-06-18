import React, { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product, Order } from '../types';
import { Download, Edit2, Trash2, Plus, Search, Lock, Database, ShieldAlert, KeyRound, ArrowRight, X, FileSpreadsheet, Calendar, MessageSquare, Send, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/FirebaseProvider';
import { useCurrency } from '../components/CurrencyContext';
import { ProductModal } from '../components/admin/ProductModal';
import { ReportModal } from '../components/admin/ReportModal';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DashboardHome = ({ products, orders }: { products: Product[], orders: Order[] }) => {
  const { formatPrice, convertPrice, selectedCurrency } = useCurrency();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Year & Month selection states
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [reportType, setReportType] = useState<'all' | 'year' | 'month'>('all');

  const totalRevenue = orders
    .filter(o => o.status !== 'Hold')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const getOrderYearAndMonth = (dateStr: string): { year: number; month: number } | null => {
    if (!dateStr) return null;
    const normalized = dateStr.replace(/\bat\b/gi, '').replace(/\s+/g, ' ').trim();
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    try {
      const cleanLower = normalized.toLowerCase();
      const yearMatch = cleanLower.match(/\b(20\d{2})\b/);
      if (!yearMatch) return null;
      const yearNum = parseInt(yearMatch[1], 10);
      
      const monthMap: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      
      for (const [key, value] of Object.entries(monthMap)) {
        if (cleanLower.includes(key)) {
          return { year: yearNum, month: value };
        }
      }
    } catch (err) {}
    return null;
  };

  const MONTHS_LIST = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  // Dynamically extract all unique years from orders
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear()); // Ensure current year is always an option
    orders.forEach(o => {
      const parsed = getOrderYearAndMonth(o.date);
      if (parsed) {
        yearsSet.add(parsed.year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [orders]);

  // Dynamically filter matching orders based on chosen parameters
  const filteredOrdersForReport = React.useMemo(() => {
    return orders.filter(o => {
      if (reportType === 'all') return true;
      const parsed = getOrderYearAndMonth(o.date);
      if (!parsed) return false;
      
      if (reportType === 'year') {
        return parsed.year === selectedYear;
      }
      if (reportType === 'month') {
        return parsed.year === selectedYear && parsed.month === selectedMonth;
      }
      return true;
    });
  }, [orders, reportType, selectedYear, selectedMonth]);

  const handleDownloadCSV = () => {
    const headers = [
      'Order ID',
      'Date/Time',
      'Customer Name',
      'Customer Email',
      'Status',
      'Gross Amount (NGN)',
      `Converted Amount (${selectedCurrency?.code || 'USD'})`,
      'Currency Symbol',
      'Tracking ID'
    ];

    const rows = filteredOrdersForReport.map(o => {
      const converted = convertPrice ? convertPrice(o.amount) : o.amount;
      const currencySymbol = selectedCurrency ? selectedCurrency.symbol : '₦';
      return [
        o.id,
        o.date || 'N/A',
        o.customerName || 'Guest',
        o.customerEmail || 'N/A',
        o.status,
        o.amount.toString(),
        converted.toFixed(2),
        currencySymbol,
        o.tracking || 'TRK-PENDING'
      ];
    });

    const totalNgnSum = filteredOrdersForReport.reduce((acc, o) => acc + o.amount, 0);
    const totalConvSum = filteredOrdersForReport.reduce((acc, o) => acc + (convertPrice ? convertPrice(o.amount) : o.amount), 0);
    const activeCurrencyCode = selectedCurrency ? selectedCurrency.code : 'NGN';

    if (reportType === 'all' || reportType === 'year') {
      rows.push([]);
      rows.push(['MONTH-BY-MONTH REVENUE BREAKDOWN']);
      rows.push(['Month', 'Transactions Count', 'Gross Revenue (Base NGN)', `Gross Revenue (${activeCurrencyCode})`]);

      MONTHS_LIST.forEach(m => {
        const monthOrders = filteredOrdersForReport.filter(o => {
          const parsed = getOrderYearAndMonth(o.date);
          return parsed && parsed.month === m.value;
        });

        const activeMonthOrders = monthOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Hold');
        const mNgnSum = activeMonthOrders.reduce((sum, o) => sum + o.amount, 0);
        const mConvSum = activeMonthOrders.reduce((sum, o) => sum + (convertPrice ? convertPrice(o.amount) : o.amount), 0);

        rows.push([
          m.label,
          monthOrders.length.toString(),
          `₦ ${mNgnSum.toLocaleString()}`,
          `${selectedCurrency?.symbol || ''} ${mConvSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      });
    }

    rows.push([]);
    rows.push(['FINANCIAL AUDIT SUMMARY']);
    rows.push(['Total Transaction Volume', filteredOrdersForReport.length.toString()]);
    rows.push(['Total Revenue (NGN)', `₦ ${totalNgnSum.toLocaleString()}`]);
    rows.push([`Total Revenue (${activeCurrencyCode})`, `${selectedCurrency?.symbol || ''} ${totalConvSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
    rows.push(['Accountable Margin Rate', '100%']);
    rows.push(['Generated Signature Log', `DLNZ_REPORT_PORTAL_${new Date().toISOString()}`]);

    let fName = 'DLNZ-Store-Audit-Full-Report.csv';
    if (reportType === 'year') {
      fName = `DLNZ-Store-Audit-Year-Ending-${selectedYear}.csv`;
    } else if (reportType === 'month') {
      const monthLabel = MONTHS_LIST[selectedMonth]?.label || 'Month';
      fName = `DLNZ-Store-Audit-${monthLabel}-${selectedYear}.csv`;
    }

    const content = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const valStr = String(val === undefined || val === null ? '' : val).replace(/"/g, '""');
        if (valStr.includes(',') || valStr.includes('\n') || valStr.includes('"')) {
          return `"${valStr}"`;
        }
        return valStr;
      }).join(','))
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsReportModalOpen(false);
  };

  const dynamicStats = React.useMemo(() => {
    const dailyMap: { [key: string]: number } = {};
    orders.forEach(o => {
      const d = o.date ? o.date.split(',')[0].trim() : 'Unknown';
      dailyMap[d] = (dailyMap[d] || 0) + o.amount;
    });

    const entries = Object.entries(dailyMap).map(([name, value]) => ({
      name,
      value
    }));

    if (entries.length === 0) {
      return Array.from({ length: 8 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: 0,
        active: false
      }));
    }

    const sorted = entries.sort((a, b) => a.name.localeCompare(b.name)).slice(-8);
    const maxVal = Math.max(...sorted.map(s => s.value), 1);

    return sorted.map(s => ({
      name: s.name,
      value: s.value,
      active: s.value === maxVal && s.value > 0
    }));
  }, [orders]);

  return (
    <>
      {/* Header */}
      <section className="mb-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-12 border-b border-outline-variant/20">
          <div>
            <span className="font-technical-sm text-[10px] text-primary mb-3 block tracking-widest opacity-60">DRIVEN LIVES, NEW ZONE. / STATUS: OPERATIONAL</span>
            <h1 className="font-display text-4xl md:text-8xl uppercase leading-none">Management</h1>
          </div>
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-all hover:bg-white w-full lg:w-auto justify-center cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </section>

      {/* Bento Stats */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-32">
        <div className="md:col-span-8 p-10 border border-outline-variant/30 bg-surface-container-lowest relative h-[450px] flex flex-col">
          <div className="flex justify-between items-start mb-12">
            <h3 className="font-technical-sm text-[10px] tracking-widest opacity-50 uppercase">Revenue Analytics (Live)</h3>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-brand-red rounded-full animate-ping" />
              <div className="w-2 h-2 bg-brand-red rounded-full absolute" />
              <span className="font-technical-sm text-[10px] uppercase tracking-widest pl-3">Real-time Stream</span>
            </div>
          </div>
          
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicStats}>
                <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                   {dynamicStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.active ? '#8B0000' : '#353535'} />
                   ))}
                </Bar>
                <XAxis dataKey="name" stroke="#4c4546" tick={{ fill: '#888', fontSize: 10, fontFamily: 'Space Mono' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: '#131313', border: '1px solid #4c4546', borderRadius: 0 }}
                  itemStyle={{ color: '#c6c6c6', fontFamily: 'Space Mono', fontSize: '10px' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-10">
            <p className="font-display text-4xl md:text-5xl text-primary leading-none font-bold text-white">
              {formatPrice(totalRevenue)}
            </p>
            <p className="font-technical-sm text-[10px] uppercase opacity-40 mt-2 tracking-widest">CALCULATED DYNAMICALLY FROM LIVE TRANSACTIONS</p>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="p-10 border border-outline-variant/30 bg-surface-container flex flex-col justify-between h-1/2">
             <h3 className="font-technical-sm text-[10px] tracking-widest opacity-50 uppercase">Pending Orders</h3>
             <div className="mt-6">
                <p className="font-display text-5xl leading-none">
                   {orders.filter(o => o.status === 'Processing' || o.status === 'Hold').length}
                </p>
                <p className="font-technical-sm text-[10px] text-brand-red underline underline-offset-8 mt-4 tracking-widest font-bold">ACTION REQUIRED</p>
             </div>
          </div>
          <div className="p-10 border border-outline-variant/30 bg-surface-container flex flex-col justify-between h-1/2">
             <h3 className="font-technical-sm text-[10px] tracking-widest opacity-50 uppercase">Active SKU Count</h3>
             <div className="mt-6">
                <p className="font-display text-5xl leading-none">{products.length.toLocaleString()}</p>
                <p className="font-technical-sm text-[10px] opacity-40 mt-4 tracking-widest uppercase">
                   {products.length > 0 ? Math.round((products.filter(p => p.stock > 0).length / products.length) * 100) : 0}% IN STOCK
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Luxury Report Selection Modal Backdrop Overlay */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-neutral-950 border border-outline-variant/30 max-w-xl w-full p-8 md:p-10 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle top ambient crimson mesh light effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent opacity-60" />

              {/* Title Section */}
              <div className="flex justify-between items-start mb-8 pb-4 border-b border-outline-variant/20">
                <div>
                  <span className="font-technical-sm text-[8px] text-brand-red tracking-widest uppercase block mb-1">Financial Reconciliation Portal</span>
                  <h3 className="font-display text-2xl uppercase tracking-tight">Ledger Compilation</h3>
                </div>
                <button 
                  onClick={() => setIsReportModalOpen(false)} 
                  className="text-[#999999] hover:text-white p-1.5 hover:bg-neutral-900/50 transition-colors border border-transparent hover:border-outline-variant/20 rounded-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 1. Report Scope Selection */}
                <div>
                  <label className="block text-[10px] uppercase text-[#8e8e8e] tracking-wider mb-3 font-mono">Select Report Scope</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setReportType('all')}
                      className={cn(
                        "p-3.5 border text-center transition-all duration-300 font-technical-sm text-[9px] uppercase tracking-wider cursor-pointer",
                        reportType === 'all'
                          ? "bg-primary text-on-primary border-primary font-bold"
                          : "border-outline-variant/20 bg-neutral-900/30 text-[#aaaaaa] hover:border-[#666666] hover:text-white"
                      )}
                    >
                      All-Time History
                    </button>
                    <button
                      onClick={() => setReportType('year')}
                      className={cn(
                        "p-3.5 border text-center transition-all duration-300 font-technical-sm text-[9px] uppercase tracking-wider cursor-pointer",
                        reportType === 'year'
                          ? "bg-primary text-on-primary border-primary font-bold"
                          : "border-outline-variant/20 bg-neutral-900/30 text-[#aaaaaa] hover:border-[#666666] hover:text-white"
                      )}
                    >
                      Year Ending
                    </button>
                    <button
                      onClick={() => setReportType('month')}
                      className={cn(
                        "p-3.5 border text-center transition-all duration-300 font-technical-sm text-[9px] uppercase tracking-wider cursor-pointer",
                        reportType === 'month'
                          ? "bg-primary text-on-primary border-primary font-bold"
                          : "border-outline-variant/20 bg-neutral-900/30 text-[#aaaaaa] hover:border-[#666666] hover:text-white"
                      )}
                    >
                      Monthly Detailed
                    </button>
                  </div>
                </div>

                {/* 2. Parameters Select Dropdowns (only shown if not 'all-time') */}
                {reportType !== 'all' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-[#8e8e8e] tracking-wider mb-2 font-mono">Target Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full bg-[#0d0d0d] border border-outline-variant/30 text-white px-3 py-3 text-[11px] font-technical-sm tracking-widest focus:border-brand-red focus:outline-none uppercase cursor-pointer"
                      >
                        {availableYears.map(y => (
                          <option key={y} value={y} className="bg-black text-white">{y} Account Cycle</option>
                        ))}
                      </select>
                    </div>
                    {reportType === 'month' && (
                      <div>
                        <label className="block text-[10px] uppercase text-[#8e8e8e] tracking-wider mb-2 font-mono">Target Month</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full bg-[#0d0d0d] border border-outline-variant/30 text-white px-3 py-3 text-[11px] font-technical-sm tracking-widest focus:border-brand-red focus:outline-none uppercase cursor-pointer"
                        >
                          {MONTHS_LIST.map(m => (
                            <option key={m.value} value={m.value} className="bg-black text-white">{m.label.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Live Preview & Audit Statistics Area */}
                <div className="bg-neutral-900/40 border border-outline-variant/20 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
                    <span className="font-technical-sm text-[8px] text-[#aeaeae] tracking-widest uppercase font-mono">Pre-Compilation Check (Live Database)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-[#717171] uppercase tracking-wider font-mono">Scope Transactions</p>
                      <p className="font-display text-2xl text-white mt-1">
                        {filteredOrdersForReport.length} <span className="text-[10px] uppercase font-technical opacity-40 ml-1">Logs</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#717171] uppercase tracking-wider font-mono">Gross Revenue</p>
                      <p className="font-display text-2xl text-brand-red mt-1 font-bold">
                        {formatPrice(filteredOrdersForReport.reduce((sum, o) => sum + o.amount, 0))}
                      </p>
                    </div>
                  </div>

                  {filteredOrdersForReport.length > 0 ? (
                    <div className="pt-3 border-t border-outline-variant/10 text-[9px] text-[#8c8c8c] flex flex-col gap-1.5 font-mono">
                      <div className="flex justify-between">
                        <span>AVERAGE ORDER VALUE:</span>
                        <span className="text-white font-bold">
                          {formatPrice(filteredOrdersForReport.reduce((sum, o) => sum + o.amount, 0) / filteredOrdersForReport.length)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SYSTEM EXCHANGE TARGET:</span>
                        <span className="text-white uppercase font-bold">
                          1 {selectedCurrency?.code || 'NGN'} = {selectedCurrency?.symbol || '₦'}{(1 * (selectedCurrency?.rate || 1)).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-outline-variant/10 text-center text-[9px] text-brand-red font-mono uppercase tracking-widest leading-relaxed">
                      ⚠️ No live transaction logs found aligning with this scope in FireStore database
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-[#6b6b6b] leading-relaxed font-sans">
                  * Generated reports comply strictly with financial ledger guidelines. The download file features both primary NGN values alongside the active currency conversion values tracking your currency switcher selection.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-outline-variant/20 mt-8 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-6 py-3.5 border border-outline-variant/30 text-[#888] hover:text-white hover:border-white transition-all font-technical-sm text-[9px] uppercase tracking-widest cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadCSV}
                  disabled={filteredOrdersForReport.length === 0}
                  className="px-6 py-3.5 bg-[#8B0000] text-white hover:bg-red-700 disabled:opacity-40 transition-all font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download CSV Compilation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const InventoryManagement = ({ 
  products, 
  onNewProduct, 
  onEditProduct, 
  onDeleteProduct,
  onSeed,
  seedingLoading
}: { 
  products: Product[], 
  onNewProduct: () => void,
  onEditProduct: (p: Product) => void,
  onDeleteProduct: (p: Product) => void,
  onSeed: () => void,
  seedingLoading: boolean
}) => {
  const { formatPrice } = useCurrency();
  return (
  <>
    {/* Sub-Header */}
    <section className="mb-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-12 border-b border-outline-variant/20">
        <div>
          <span className="font-technical-sm text-[10px] text-primary mb-3 block tracking-widest opacity-60">MASTER CATALOG / SECTOR: INVENTORY</span>
          <h1 className="font-display text-4xl md:text-8xl uppercase leading-none">Products</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <button 
            onClick={onSeed}
            disabled={seedingLoading}
            className="border border-outline-variant/60 text-primary px-8 py-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-white hover:text-black w-full sm:w-auto disabled:opacity-40 cursor-pointer"
          >
             <Database className="w-4 h-4 text-brand-red animate-pulse" />
             {seedingLoading ? 'SEEDING LIVE DATABASE...' : 'SEED LIVE DB'}
          </button>
          <button 
            onClick={onNewProduct}
            className="bg-brand-red text-white px-8 py-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-all hover:brightness-110 w-full sm:w-auto justify-center cursor-pointer"
          >
             <Plus className="w-4 h-4" />
             New Product
          </button>
        </div>
      </div>
    </section>

    <section className="mb-32">
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
           <div key={product.id} className="group border border-outline-variant/20 bg-surface">
              <div className="aspect-[3/4] overflow-hidden bg-surface-container-high border-b border-outline-variant/10">
                 <img alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" src={product.image} />
              </div>
              <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <span className="font-technical-sm text-[8px] opacity-40">{product.sku}</span>
                    <span className={cn(
                      "px-2 py-0.5 border text-[8px] font-technical-sm uppercase",
                      product.stock > 0 ? "border-outline-variant/30 opacity-60" : "border-brand-red text-brand-red"
                    )}>
                       {product.stock > 0 ? `${product.stock} IN STOCK` : 'SOLD OUT'}
                    </span>
                 </div>
                 <h4 className="font-body font-bold uppercase tracking-tight text-sm mb-6">{product.name}</h4>
                 <div className="flex justify-between items-center">
                    <span className="font-technical-sm text-xs">{formatPrice(product.price)}</span>
                    <div className="flex gap-4">
                       <button 
                        onClick={() => onEditProduct(product)}
                        className="text-primary/40 hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                       <button 
                        onClick={() => onDeleteProduct(product)}
                        className="text-primary/40 hover:text-brand-red transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
              </div>
           </div>
        ))}
        <div 
          onClick={onNewProduct}
          className="border border-dashed border-outline-variant/30 bg-surface-container-lowest flex flex-col items-center justify-center p-10 cursor-pointer hover:bg-surface-variant/10 transition-colors group"
        >
           <Plus className="w-10 h-10 text-outline-variant group-hover:text-primary transition-all mb-4" />
           <p className="font-technical-sm text-[10px] tracking-widest opacity-40 uppercase">Quick Add SKU</p>
        </div>
     </div>
  </section>
  </>
  );
};

const OrdersManagement = ({ orders, onUpdateStatus }: { orders: Order[], onUpdateStatus: (id: string, status: Order['status']) => void }) => {
  const { formatPrice } = useCurrency();
  return (
  <>
    {/* Sub-Header */}
    <section className="mb-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-12 border-b border-outline-variant/20">
        <div>
          <span className="font-technical-sm text-[10px] text-primary mb-3 block tracking-widest opacity-60">LOGISTICS UNIT / SECTOR: FULFILLMENT</span>
          <h1 className="font-display text-4xl md:text-8xl uppercase leading-none">Orders</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-technical-sm opacity-40 hover:opacity-100 transition-all border border-outline-variant/30 px-6 py-4 w-full lg:w-80 group hover:border-primary">
           <Search className="w-4 h-4" />
           <input className="bg-transparent border-none p-0 focus:ring-0 uppercase tracking-widest placeholder:text-current w-full" placeholder="Search Order ID..." />
        </div>
      </div>
    </section>

  <section>
     <div className="overflow-x-auto border border-outline-variant/30">
        <table className="w-full border-collapse">
           <thead>
              <tr className="bg-surface-container border-b border-outline-variant/30">
                 <th className="p-6 text-left font-technical-sm text-[10px] tracking-[0.2em] opacity-40 uppercase">Order ID</th>
                 <th className="p-6 text-left font-technical-sm text-[10px] tracking-[0.2em] opacity-40 uppercase">Customer</th>
                 <th className="p-6 text-left font-technical-sm text-[10px] tracking-[0.2em] opacity-40 uppercase">Date</th>
                 <th className="p-6 text-left font-technical-sm text-[10px] tracking-[0.2em] opacity-40 uppercase">Amount</th>
                 <th className="p-6 text-left font-technical-sm text-[10px] tracking-[0.2em] opacity-40 uppercase">Status</th>
                 <th className="p-6 text-right font-technical-sm text-[10px] tracking-[0.2em] opacity-40 uppercase">Action/Status Control</th>
              </tr>
           </thead>
           <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/10 transition-all group">
                   <td className="p-6 font-technical-sm text-xs">#{order.id}</td>
                   <td className="p-6">
                      <p className="font-body font-bold text-sm uppercase">{order.customerName}</p>
                      <p className="font-technical text-[10px] opacity-40 lowercase">{order.customerEmail}</p>
                   </td>
                   <td className="p-6 font-technical-sm text-[10px] opacity-60 uppercase">{order.date}</td>
                   <td className="p-6 font-technical-sm text-sm">{formatPrice(order.amount)}</td>
                   <td className="p-6">
                      <span className={cn(
                        "px-3 py-1 text-[8px] font-technical-sm uppercase tracking-widest",
                        order.status === 'Processing' ? "bg-white text-black font-bold" :
                        order.status === 'Cancelled' ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50" :
                        order.status === 'Delivered' ? "bg-green-950 text-green-400 border border-green-900/30 font-semibold" :
                        order.status === 'Shipped' ? "bg-brand-charcoal text-primary border border-outline/30" :
                        "border border-brand-red text-brand-red"
                      )}>
                         {order.status}
                      </span>
                   </td>
                   <td className="p-6 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                        className="bg-brand-charcoal text-primary border border-outline-variant/30 px-3 py-2 text-[10px] font-technical-sm focus:border-brand-red uppercase outline-none cursor-pointer"
                      >
                        <option value="Processing" className="bg-black text-white">Processing</option>
                        <option value="Shipped" className="bg-black text-white">Shipped</option>
                        <option value="Hold" className="bg-black text-white font-bold text-brand-red">Hold</option>
                        <option value="Delivered" className="bg-black text-white">Delivered</option>
                        <option value="Cancelled" className="bg-black text-white">Cancelled</option>
                      </select>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
     </div>
  </section>
  </>
  );
};

const ChatsManagement = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Subscribe to live chats in Firestore
  useEffect(() => {
    const q = query(collection(db, 'support_chats'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const chatsList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatsList);
      setLoading(false);
    }, (err) => {
      console.error('Failed to sync live chats list:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const activeChat = chats.find(c => c.id === selectedChatId);

  useEffect(() => {
    if (activeChat?.messages) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedChatId || !activeChat) return;

    const newReply = {
      id: Math.random().toString(36).substring(2, 11),
      role: 'model', // Send response representing the support JOE chatbot/staff
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...(activeChat.messages || []), newReply];
    setReplyText('');

    try {
      const docRef = doc(db, 'support_chats', selectedChatId);
      await setDoc(docRef, {
        messages: updatedMessages,
        lastMessage: newReply.text,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Failed to submit staff response to Firestore:', err);
    }
  };

  return (
    <div className="border border-outline-variant/30 min-h-[600px] flex flex-col lg:flex-row bg-surface">
      {/* Sidebar List */}
      <div className="w-full lg:w-80 border-r border-outline-variant/20 flex flex-col shrink-0">
        <div className="p-4 bg-surface-container flex items-center justify-between border-b border-outline-variant/20">
          <h3 className="font-technical-sm text-[10px] uppercase font-bold tracking-widest text-[#8e8e8e]">Support Logs</h3>
          <span className="px-2 py-0.5 bg-brand-red text-white text-[8px] font-mono tracking-widest leading-none rounded-none">{chats.length} Active</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/15 max-h-[520px]">
          {loading ? (
            <div className="p-8 text-center text-[10px] font-mono text-[#8e8e8e] uppercase tracking-wider animate-pulse font-bold">Sourcing Live Records...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-[10px] font-mono text-[#8e8e8e] uppercase tracking-wider font-bold">No Active Sessions</div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  "w-full text-left p-5 transition-all duration-200 outline-none flex flex-col gap-1 hover:bg-surface-variant/15 cursor-pointer block",
                  selectedChatId === chat.id ? "bg-surface-container border-l-2 border-brand-red" : "border-l-2 border-transparent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-technical text-[10px] text-white font-bold tracking-wider">{chat.id}</span>
                  <div className="flex items-center gap-1 opacity-40 text-[8px] font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {chat.updatedAt?.seconds 
                        ? new Date(chat.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : 'Active Now'}
                    </span>
                  </div>
                </div>
                <p className="font-sans text-[11px] text-[#aeaeae] truncate max-w-[240px] mt-1">{chat.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        {activeChat ? (
          <>
            <div className="p-4 bg-[#0a0a0a] border-b border-outline-variant/20 flex justify-between items-center px-6">
              <div>
                <h4 className="font-technical-sm text-xs text-white uppercase font-bold tracking-wider">Session {activeChat.id}</h4>
                <p className="text-[9px] text-[#8e8e8e] uppercase font-mono tracking-widest mt-0.5">Assigned Agent: JOE (Customer Assistant)</p>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px] min-h-[300px] bg-[#020202]">
              {activeChat.messages && activeChat.messages.map((msg: any) => (
                <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-start" : "items-end")}>
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 text-[11px] leading-relaxed border rounded-sm font-sans",
                    msg.role === 'user'
                      ? "bg-[#121212] border-outline-variant/20 text-gray-300"
                      : "bg-brand-red border-brand-red text-white font-medium"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-sans text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                    {msg.role === 'user' ? 'GUEST CUSTOMER' : 'JOE (STAFF)'} • {msg.timestamp}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="p-4 bg-[#0c0c0c] border-t border-outline-variant/20 flex gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type real-time reply as Agent JOE..."
                className="flex-1 bg-black border border-outline-variant/30 px-3.5 py-3 text-[11px] font-sans placeholder:opacity-30 focus:outline-none focus:border-brand-red text-white"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="bg-brand-red text-white px-6 flex items-center justify-center hover:bg-brand-red/90 transition-all cursor-pointer disabled:opacity-50 font-technical-sm text-[10px] tracking-widest uppercase font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-2" />
                Reply
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#020202]">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4 border border-outline-variant/20">
              <MessageSquare className="w-8 h-8 opacity-45 text-brand-red animate-pulse" />
            </div>
            <h4 className="font-display text-sm uppercase tracking-wider mb-2 font-bold text-white">Live Customer Chats</h4>
            <p className="font-sans text-xs text-[#8e8e8e] leading-relaxed max-w-sm">
              Select an active customer conversation session from the left side panel list to view in real-time or manually respond as Agent JOE.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const { 
    isAdmin: isAuthorized, 
    loading: authLoading, 
    login, 
    loginWithEmail, 
    registerWithEmail, 
    authError, 
    setAuthError 
  } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Email login states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Safe custom sandbox-friendly confirmation overlays
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isConfirmingSeed, setIsConfirmingSeed] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState(false);
  const [seedingError, setSeedingError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    let unsubscribeProducts: (() => void) | undefined;
    let unsubscribeOrders: (() => void) | undefined;

    if (isAuthorized) {
      setLoading(true);
      
      // Real-time products subscription
      unsubscribeProducts = productService.subscribeToProducts((pData) => {
        setProducts(pData);
        setLoading(false);
      }, () => {
        setLoading(false);
      });

      // Real-time orders subscription
      unsubscribeOrders = orderService.subscribeToOrders((oData) => {
        setOrders(oData);
      });
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [isAuthorized, authLoading]);

  const handleDeleteProduct = async (product: Product) => {
    setProductToDelete(product);
  };

  const [seedingLoading, setSeedingLoading] = useState(false);
  const handleSeedDatabase = async () => {
    setIsConfirmingSeed(true);
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: Order['status']) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setLocalError('Please fill in all requested fields.');
      return;
    }
    setLocalError(null);
    setAuthError(null);
    setActionLoading(true);

    try {
      if (isRegistering) {
        if (!nameInput) {
          setLocalError('Please specify a profile display name.');
          setActionLoading(false);
          return;
        }
        await registerWithEmail(emailInput, passwordInput, nameInput);
      } else {
        await loginWithEmail(emailInput, passwordInput);
      }
    } catch (err: any) {
      console.error('Auth action failed:', err);
      setLocalError(err?.message || 'Authentication failed. Please check credentials or Firebase setup.');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = [
    { name: '01', value: 30 },
    { name: '02', value: 45 },
    { name: '03', value: 35 },
    { name: '04', value: 80, active: true },
    { name: '05', value: 60 },
    { name: '06', value: 40 },
    { name: '07', value: 90 },
    { name: '08', value: 55 },
  ];

  if (authLoading || (isAuthorized && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black text-white relative font-sans">
        {/* Ambient absolute graphics in background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="w-full max-w-4xl border border-outline-variant/20 bg-neutral-950 p-8 sm:p-12 shadow-2xl relative z-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-outline-variant/20">
            <div className="p-3 bg-brand-red/10 border border-brand-red/30">
              <Lock className="w-6 h-6 text-brand-red animate-pulse" />
            </div>
            <div>
              <span className="font-technical-sm text-[9px] text-brand-red block tracking-widest uppercase font-mono">DLNZ ADMINISTRATION SECTOR</span>
              <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-tight">Security Gateway</h1>
            </div>
          </div>

          <div className="space-y-8">
            <p className="font-body text-xs text-[#b8b8b8] leading-relaxed max-w-2xl">
              Strictly restricted interface. Sign in using your Google account or authorized administrator credentials to access live sector inventories and master order logs of DLNZ.
            </p>

            {/* Error Indicators */}
            {(authError || localError) && (
              <div className="p-4 bg-brand-red/10 border border-brand-red/40 text-xs text-brand-red font-mono flex flex-col gap-1 rounded-sm">
                <span className="font-bold uppercase tracking-wider text-[10px]">⚠️ GATEWAY EXCEPTION:</span>
                <p>{localError || authError}</p>
                {authError?.includes('disabled') && (
                  <p className="text-[#a0a0a0] leading-normal text-[10px] mt-2 font-sans normal-case">
                    📢 Note: Go into your Firebase Authentication Console, locate the "Sign-in method" tab, and make sure to enable the "Email/Password" and "Google" providers.
                  </p>
                )}
              </div>
            )}

            {/* SEGMENTED GATEWAYS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* Option 1: Live Google Auth */}
              <div className="border border-outline-variant/20 bg-neutral-950 p-6 sm:p-8 flex flex-col justify-between hover:border-brand-red/60 transition-all duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="w-4 h-4 text-brand-red" />
                    <span className="font-technical-sm text-[10px] tracking-widest uppercase text-white/90 font-mono">Identity Provider</span>
                  </div>
                  <h3 className="font-display text-base uppercase mb-2">Live Google Authentication</h3>
                  <p className="text-[11px] text-[#8e8e8e] leading-relaxed mb-8">
                    Connect through your primary Google Account registered on the Firestore project database.
                  </p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={login}
                    className="w-full bg-brand-red text-white py-3 px-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all cursor-pointer border border-brand-red"
                  >
                    Google Sign-In
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <p className="text-[9px] text-[#6b6b6b] leading-tight font-sans text-center">
                    📢 <span className="text-brand-red font-semibold">Notice:</span> standard cookie popups are blocked inside sandboxed widgets. For Google login to load, click <span className="font-bold underline">"Open in New Tab"</span> at the top right of AI Studio.
                  </p>
                </div>
              </div>

              {/* Option 2: Live Email/Password Credentials (NATIVE/IFRAME FRIENDLY) */}
              <div className="border border-outline-variant/20 bg-neutral-900/60 p-6 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300">
                <form onSubmit={handleEmailAuth} className="space-y-4 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-brand-red" />
                      <span className="font-technical-sm text-[10px] tracking-widest uppercase text-white/90 font-mono">Credentials Secure</span>
                    </div>
                  </div>

                  <h3 className="font-display text-base uppercase">
                    {isRegistering ? 'Create Security Account' : 'Credentials Authorization'}
                  </h3>

                  <div className="space-y-3">
                    {isRegistering && (
                      <div>
                        <label className="block text-[10px] uppercase text-[#8e8e8e] tracking-wider mb-1 font-mono">Clearance Name</label>
                        <input 
                          type="text" 
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="e.g. Abdulsamad Admin"
                          className="w-full bg-black/60 border border-white/10 p-2.5 text-xs focus:border-brand-red focus:outline-none transition-colors text-white font-sans"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-[10px] uppercase text-[#8e8e8e] tracking-wider mb-1 font-mono">Email Address</label>
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="abdulsamadtaiwo648@gmail.com"
                        className="w-full bg-black/60 border border-white/10 p-2.5 text-xs focus:border-brand-red focus:outline-none transition-colors text-white font-sans"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-[#8e8e8e] tracking-wider mb-1 font-mono">Password</label>
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/60 border border-white/10 p-2.5 text-xs focus:border-brand-red focus:outline-none transition-colors text-white font-sans"
                        required
                        minLength={6}
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={actionLoading}
                      className="w-full border border-white text-white py-3 px-4 font-technical-sm text-[10px] uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all cursor-pointer font-bold disabled:opacity-40"
                    >
                      {actionLoading ? 'Verifying Gateway...' : isRegistering ? 'Register & Authenticate' : 'Authorize Security Key'}
                    </button>
                    
                    <div className="text-center pt-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setLocalError(null);
                        }}
                        className="text-[9px] text-[#aeaeae] uppercase hover:text-brand-red tracking-wider transition-colors"
                      >
                        {isRegistering ? '← Back to Credentials Gate' : 'New Security Account? Create profile'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>

            {/* Bottom Controls / Back */}
            <div className="pt-6 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 opacity-40">
                <ShieldAlert className="w-4 h-4 text-brand-red" />
                <span className="font-technical-sm text-[8px] uppercase tracking-widest font-mono">DRIVEN LIVES, NEW ZONE // LIVE SECURE FIRESTORE INTEGRATION</span>
              </div>
              <Link 
                to="/"
                className="font-technical-sm text-[10px] uppercase tracking-widest text-[#8e8e8e] hover:text-white transition-colors flex items-center gap-1 font-mono"
              >
                ← Return to Genesis
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-16 pb-32 px-6 md:px-12 lg:px-20 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<DashboardHome products={products} orders={orders} />} />
          <Route path="inventory" element={
            <InventoryManagement 
              products={products} 
              onNewProduct={() => { setSelectedProduct(null); setIsModalOpen(true); }}
              onEditProduct={(p) => { setSelectedProduct(p); setIsModalOpen(true); }}
              onDeleteProduct={handleDeleteProduct}
              onSeed={handleSeedDatabase}
              seedingLoading={seedingLoading}
            />
          } />
          <Route path="orders" element={<OrdersManagement orders={orders} onUpdateStatus={handleUpdateOrderStatus} />} />
          <Route path="chats" element={<ChatsManagement />} />
          <Route path="analytics" element={<DashboardHome products={products} orders={orders} />} />
          <Route path="*" element={<DashboardHome products={products} orders={orders} />} />
        </Routes>
      </div>

      <ProductModal 
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async () => {
          try {
            const updatedProducts = await productService.getAllProducts().catch(() => []);
            setProducts(updatedProducts);
          } catch (err) {
            console.error('Failed to sync updated products:', err);
          }
        }}
      />

      {/* Safe confirmation modal for deleting products */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black border border-outline-variant/30 max-w-sm w-full p-8"
            >
              <h3 className="font-display text-sm uppercase tracking-wider mb-2 font-bold text-white">Erase SKU Record?</h3>
              <p className="font-sans text-xs text-[#aeaeae] leading-relaxed mb-6">
                Are you absolutely sure you want to delete <span className="text-white font-semibold font-mono">{productToDelete.name}</span> from the catalog? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-3 border border-outline-variant/40 text-[10px] uppercase font-bold tracking-widest text-[#aaa] hover:text-white rounded-none cursor-pointer hover:border-white transition-all bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const pId = productToDelete.id;
                    setProductToDelete(null);
                    try {
                      await productService.deleteProduct(pId);
                    } catch (err) {
                      console.error('Delete product failed:', err);
                    }
                  }}
                  className="flex-1 py-3 bg-brand-red text-white text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 rounded-none cursor-pointer transition-all border-none font-bold"
                >
                  Delete SKU
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safe confirmation modal for database seeding */}
      <AnimatePresence>
        {isConfirmingSeed && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black border border-outline-variant/30 max-w-sm w-full p-8"
            >
              <h3 className="font-display text-sm uppercase tracking-wider mb-2 font-bold text-white">Populate Live Registry?</h3>
              <p className="font-sans text-xs text-[#aeaeae] leading-relaxed mb-6">
                Are you sure you want to seed the default premium streetwear collection items and initial order entries into your live database?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsConfirmingSeed(false)}
                  className="flex-1 py-3 border border-outline-variant/40 text-[10px] uppercase font-bold tracking-widest text-[#aaa] hover:text-white rounded-none cursor-pointer hover:border-white transition-all bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsConfirmingSeed(false);
                    setSeedingLoading(true);
                    try {
                      const response = await fetch('/api/admin/seed', { method: 'POST' });
                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                      }
                      setSeedingSuccess(true);
                    } catch (err: any) {
                      console.error('Seeding error:', err);
                      setSeedingError(err?.message || String(err));
                    } finally {
                      setSeedingLoading(false);
                    }
                  }}
                  className="flex-1 py-3 bg-brand-red text-white text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 rounded-none cursor-pointer transition-all border-none font-bold"
                >
                  Confirm Seed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seed database success dialog */}
      <AnimatePresence>
        {seedingSuccess && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black border border-white/20 max-w-xs w-full p-8 text-center"
            >
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-5 h-5 animate-bounce" />
              </div>
              <h3 className="font-display text-xs uppercase tracking-widest mb-2 font-bold text-white">Database Seeded</h3>
              <p className="font-sans text-[11px] text-[#aeaeae] leading-relaxed mb-6">
                Default collections populated with live luxury products and initial fulfillment records successfully!
              </p>
              <button
                onClick={() => setSeedingSuccess(false)}
                className="w-full py-2.5 bg-white text-black font-technical-sm text-[10px] uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Seed database error dialog */}
      <AnimatePresence>
        {seedingError && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black border border-brand-red/25 max-w-xs w-full p-8 text-center"
            >
              <div className="w-12 h-12 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="font-display text-xs uppercase tracking-widest mb-2 font-bold text-[#f55]">Seeding Aborted</h3>
              <p className="font-sans text-[10px] text-[#aeaeae] leading-relaxed mb-6 truncate">
                {seedingError}
              </p>
              <button
                onClick={() => setSeedingError(null)}
                className="w-full py-2.5 border border-outline-variant/50 text-[#ccc] hover:text-white font-technical-sm text-[10px] uppercase tracking-widest font-bold hover:border-white transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

