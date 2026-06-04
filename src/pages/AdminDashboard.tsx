import React, { useEffect, useState, useCallback } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product, Order } from '../types';
import { Download, Edit2, Trash2, Plus, Search, Lock, Database, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/FirebaseProvider';
import { ProductModal } from '../components/admin/ProductModal';

const DashboardHome = ({ products, orders, stats }: { products: Product[], orders: Order[], stats: any[] }) => (
  <>
    {/* Header */}
    <section className="mb-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-12 border-b border-outline-variant/20">
        <div>
          <span className="font-technical-sm text-[10px] text-primary mb-3 block tracking-widest opacity-60">DRIVEN LIVES, NEW ZONE. / STATUS: OPERATIONAL</span>
          <h1 className="font-display text-4xl md:text-8xl uppercase leading-none">Management</h1>
        </div>
        <button className="bg-primary text-on-primary px-8 py-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-all hover:bg-white w-full lg:w-auto justify-center">
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>
    </section>

    {/* Bento Stats */}
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-32">
      <div className="md:col-span-8 p-10 border border-outline-variant/30 bg-surface-container-lowest relative h-[450px] flex flex-col">
        <div className="flex justify-between items-start mb-12">
          <h3 className="font-technical-sm text-[10px] tracking-widest opacity-50 uppercase">Revenue Analytics (30D)</h3>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-brand-red rounded-full" />
            <span className="font-technical-sm text-[10px] uppercase tracking-widest">Live Sales</span>
          </div>
        </div>
        
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                 {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.active ? '#8B0000' : '#353535'} />
                 ))}
              </Bar>
              <XAxis dataKey="name" hide />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                contentStyle={{ backgroundColor: '#131313', border: '1px solid #4c4546', borderRadius: 0 }}
                itemStyle={{ color: '#c6c6c6', fontFamily: 'Space Mono', fontSize: '10px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-10">
          <p className="font-display text-4xl md:text-5xl text-primary leading-none">₦142,800,500.50</p>
          <p className="font-technical-sm text-[10px] uppercase opacity-40 mt-2 tracking-widest">+12.4% VS PREVIOUS MONTH</p>
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
                 {Math.round((products.filter(p => p.stock > 0).length / products.length) * 100) || 0}% IN STOCK
              </p>
           </div>
        </div>
      </div>
    </section>
  </>
);

const InventoryManagement = ({ 
  products, 
  onNewProduct, 
  onEditProduct, 
  onDeleteProduct 
}: { 
  products: Product[], 
  onNewProduct: () => void,
  onEditProduct: (p: Product) => void,
  onDeleteProduct: (p: Product) => void
}) => (
  <>
    {/* Sub-Header */}
    <section className="mb-16">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-12 border-b border-outline-variant/20">
        <div>
          <span className="font-technical-sm text-[10px] text-primary mb-3 block tracking-widest opacity-60">MASTER CATALOG / SECTOR: INVENTORY</span>
          <h1 className="font-display text-4xl md:text-8xl uppercase leading-none">Products</h1>
        </div>
        <button 
          onClick={onNewProduct}
          className="bg-brand-red text-white px-8 py-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 active:scale-95 transition-all hover:brightness-110 w-full lg:w-auto justify-center"
        >
           <Plus className="w-4 h-4" />
           New Product
        </button>
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
                    <span className="font-technical-sm text-xs">₦ {product.price.toLocaleString()}</span>
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

const OrdersManagement = ({ orders, onUpdateStatus }: { orders: Order[], onUpdateStatus: (id: string, status: Order['status']) => void }) => (
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
                   <td className="p-6 font-technical-sm text-sm">₦ {order.amount.toLocaleString()}</td>
                   <td className="p-6">
                      <span className={cn(
                        "px-3 py-1 text-[8px] font-technical-sm uppercase tracking-widest",
                        order.status === 'Processing' ? "bg-white text-black font-bold" :
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
  const [isRegistering, setIsRegistering] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (isAuthorized) {
        const [pData, oData] = await Promise.all([
          productService.getAllProducts(),
          orderService.getAllOrders()
        ]);
        setProducts(pData);
        setOrders(oData);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [fetchData, authLoading]);

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      await productService.deleteProduct(product.id);
      fetchData();
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: Order['status']) => {
    try {
      await orderService.updateOrderStatus(id, newStatus);
      fetchData();
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
          <Route path="/" element={<DashboardHome products={products} orders={orders} stats={stats} />} />
          <Route path="inventory" element={
            <InventoryManagement 
              products={products} 
              onNewProduct={() => { setSelectedProduct(null); setIsModalOpen(true); }}
              onEditProduct={(p) => { setSelectedProduct(p); setIsModalOpen(true); }}
              onDeleteProduct={handleDeleteProduct}
            />
          } />
          <Route path="orders" element={<OrdersManagement orders={orders} onUpdateStatus={handleUpdateOrderStatus} />} />
          <Route path="analytics" element={<DashboardHome products={products} orders={orders} stats={stats} />} />
          <Route path="*" element={<DashboardHome products={products} orders={orders} stats={stats} />} />
        </Routes>
      </div>

      <ProductModal 
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

