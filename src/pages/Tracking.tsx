import React, { useState, useEffect } from 'react';
import { ArrowRight, Box, Package, Truck, CheckCircle2, MessageSquare, ExternalLink, Loader2, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { orderService } from '../services/orderService';
import { Order } from '../types';
import { WHATSAPP_LINK } from '../constants';
import { useAuth } from '../components/FirebaseProvider';
import { useCurrency } from '../components/CurrencyContext';

export const Tracking = () => {
  const { user, setIsAuthModalOpen } = useAuth();
  const { formatPrice } = useCurrency();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [activeOrderId, setActiveOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [fetchingUserOrders, setFetchingUserOrders] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async (targetId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    setCancelling(true);
    try {
      await orderService.updateOrderStatus(targetId, 'Cancelled');
      // refresh order details
      const found = await orderService.getOrderById(targetId);
      if (found) {
        setOrder(found);
      }
      // refresh order list
      if (user) {
        const list = await orderService.getUserOrders(user.uid);
        setUserOrders(list);
      }
      alert('order canceled successfully');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }
    const fetchUserOrders = async () => {
      setFetchingUserOrders(true);
      try {
        const list = await orderService.getUserOrders(user.uid);
        setUserOrders(list);
      } catch (err) {
        console.error('Error fetching user orders:', err);
      } finally {
        setFetchingUserOrders(false);
      }
    };
    fetchUserOrders();
  }, [user, activeOrderId]);

  useEffect(() => {
    if (!activeOrderId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const found = await orderService.getOrderById(activeOrderId);
        if (found) {
          setOrder(found);
        } else {
          setOrder(null);
          setErrorMsg('Order ID not found in system logs.');
        }
      } catch (err) {
        console.error('Error fetching order for tracking:', err);
        setErrorMsg('Failed to query logistical network.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [activeOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setActiveOrderId(orderIdInput.trim().toUpperCase());
    }
  };

  const status = order?.status || 'Processing';
  const orderDate = order?.date || 'OCT 12, 2026';

  const isCompleted = (s: string) => {
    if (status === 'Delivered') return true;
    if (status === 'Shipped') return s === 'Order Received' || s === 'Processing' || s === 'Shipped';
    if (status === 'Processing') return s === 'Order Received' || s === 'Processing';
    if (status === 'Hold') return s === 'Order Received';
    return s === 'Order Received';
  };

  const isActive = (s: string) => {
    if (status === s) return true;
    if (status === 'Hold' && s === 'Processing') return true;
    return false;
  };

  const getStatusType = (s: string) => {
    if (isCompleted(s)) return 'completed';
    if (isActive(s)) return 'active';
    return 'pending';
  };

  const steps = [
    { label: 'Order Received', date: orderDate.includes(':') ? orderDate : `${orderDate} - 09:41`, status: getStatusType('Order Received'), icon: Box },
    { 
      label: 'Processing', 
      date: status === 'Processing' || status === 'Hold' ? 'CURRENT ZONE' : 'COMPLETED', 
      status: getStatusType('Processing'), 
      icon: Package,
      detail: status === 'Hold' ? 'STATUS: TEMPORARY HOLD\nLOGISTICAL EXCEPTION CHECKING IN PROGRESS.' : undefined
    },
    { 
      label: 'Shipped', 
      date: status === 'Shipped' ? 'IN TRANSIT' : status === 'Delivered' ? 'DELIVERED TO CARRIER' : 'PENDING', 
      status: getStatusType('Shipped'), 
      icon: Truck, 
      detail: status === 'Shipped' ? `COURIER: UPS / DHL WORLDWIDE\nTRACKING NO: ${order?.tracking || 'TRK-' + activeOrderId}` : undefined 
    },
    { label: 'Out for Delivery', date: status === 'Delivered' ? 'COMPLETED' : 'PENDING', status: getStatusType('Out for Delivery'), icon: Truck },
    { label: 'Delivered', date: status === 'Delivered' ? 'FULFILLED' : 'PENDING', status: getStatusType('Delivered'), icon: CheckCircle2 },
  ];

  return (
    <div className="pt-32 pb-40 max-w-7xl mx-auto px-6 md:px-16 min-h-screen">
      <section className="mb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8">
            <h1 className="font-display text-4xl md:text-7xl uppercase leading-none mb-6">Track Order</h1>
            <p className="font-technical-sm text-on-surface-variant max-w-xl leading-relaxed opacity-80 uppercase">
              ENTER YOUR UNIQUE IDENTIFIER TO RETRIEVE THE CURRENT GEOGRAPHICAL POSITIONING AND LOGISTICAL STATUS OF YOUR PIECE.
            </p>
          </div>
          <div className="md:col-span-4">
            <form onSubmit={handleSearchSubmit} className="w-full">
               <label className="font-label-xs text-on-surface-variant mb-3 block opacity-60">ORDER ID</label>
               <div className="flex border-b border-brand-silver/30 group focus-within:border-primary transition-all">
                  <input 
                     className="bg-transparent border-none w-full py-5 px-0 font-technical text-sm text-primary placeholder:opacity-20 focus:ring-0 uppercase tracking-widest outline-none" 
                     placeholder="DLNZ-000-000-00" 
                     type="text" 
                     value={orderIdInput}
                     onChange={(e) => setOrderIdInput(e.target.value)}
                  />
                  <button type="submit" className="text-primary hover:text-brand-red transition-colors px-2 cursor-pointer">
                    <ArrowRight className="w-5 h-5" />
                  </button>
               </div>
            </form>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-brand-red animate-spin mb-4" />
          <p className="font-technical-sm text-xs opacity-60 uppercase tracking-widest">Accessing Logistical Nodes...</p>
        </div>
      ) : errorMsg ? (
        <div className="min-h-[400px] border border-outline-variant/30 bg-surface-container-lowest p-16 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-brand-charcoal border border-brand-red/30 flex items-center justify-center mb-8">
            <Search className="w-6 h-6 text-brand-red" />
          </div>
          <h2 className="font-display text-3xl uppercase mb-4 tracking-tighter">No Record Found</h2>
          <p className="font-technical-sm text-[10px] uppercase opacity-40 max-w-sm tracking-widest leading-relaxed">
            {errorMsg} Check your spelling or coordinate with support to verify registration.
          </p>
        </div>
      ) : order ? (
        <div className="space-y-12">
          {order.status === 'Cancelled' && (
            <div className="p-8 bg-red-950/20 border border-brand-red/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                 <h3 className="font-display text-xl uppercase text-brand-red tracking-tight mb-2">Order Cancelled</h3>
                 <p className="font-technical-sm text-[10px] uppercase opacity-60 tracking-widest leading-relaxed">
                   THIS ORDER HAS BEEN CANCELLED AND REMOVED FROM ALL DELIVERY FLOWS.
                 </p>
               </div>
               <div className="self-start md:self-center">
                  <span className="bg-brand-red text-white px-4 py-1.5 font-technical-sm text-[10px] font-bold tracking-widest">CANCELLED</span>
               </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
          {/* Timeline */}
          <div className="lg:col-span-7">
             <div className="space-y-0 relative">
               {steps.map((step, index) => (
                  <div key={index} className="flex gap-10 group min-h-[140px]">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                         "w-4 h-4 rounded-full z-10 transition-all duration-500",
                         step.status === 'completed' ? "bg-primary" : 
                         step.status === 'active' ? "bg-brand-red shadow-[0_0_20px_rgba(139,0,0,0.6)]" : 
                         "bg-outline-variant/30"
                      )} />
                      {index < steps.length - 1 && (
                        <div className={cn(
                          "w-[1px] flex-grow -my-1 transition-all duration-500",
                          step.status === 'completed' ? "bg-primary" : "bg-outline-variant/20 border-dashed border-l"
                        )} />
                      )}
                    </div>
                    <div className={cn(
                      "pb-12 transition-all duration-500",
                      step.status === 'pending' ? "opacity-30" : "opacity-100"
                    )}>
                      <h3 className={cn(
                        "font-technical-sm text-[10px] mb-2 tracking-[0.15em]",
                        step.status === 'active' ? "text-brand-red font-bold" : "text-on-surface-variant opacity-60"
                      )}>
                        {step.date}
                      </h3>
                      <p className="font-display text-2xl uppercase tracking-tighter">{step.label}</p>
                      
                      {step.detail && (
                         <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mt-6 p-6 bg-brand-charcoal border border-outline-variant/10 inline-block font-technical-sm text-[10px] space-y-2 opacity-60 uppercase"
                         >
                           {step.detail.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                           <p className="text-brand-red">DRIVEN LIVES, NEW ZONE.</p>
                         </motion.div>
                      )}
                    </div>
                  </div>
               ))}
             </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-5 space-y-16">
            <div className="aspect-[4/5] bg-brand-charcoal overflow-hidden border border-outline-variant/10 grayscale opacity-80 hover:opacity-100 transition-all duration-1000">
               <img 
                 alt={order.productName || "Order Item"} 
                 className="w-full h-full object-cover" 
                 src={order.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuANfkNmleLkwcHHi-3iG6QiqS72q_IfoFXKRiW8c-TC6VaF3OMq20kUXd2OICGCpx_BPzbL2iQmua0qOkyZFV-4-YAPDY8zyS2p52FWkgD0-64h0LUyw22DGfhymB4EwGLZJkQx-YPKvyeMsw41mURqSWtBj4tpEaBMGCzhMZjKvIsiA7LeDqekvfzY8a8-No3knsnspGohmDNZikAgh4dwY8VHz0UxOlg4iqh0TCvNzGtHAnVrtjlZrcEPDi-O7MoN8slrObCYhro"} 
                 referrerPolicy="no-referrer"
               />
            </div>

            <div className="border-t border-brand-silver/20 pt-10">
               <h2 className="font-technical-sm text-[10px] tracking-[0.3em] opacity-40 mb-8 uppercase">Order Summary / {order.id}</h2>
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="font-display text-2xl uppercase tracking-tighter leading-none mb-2">{order.productName || 'DLNZ Collector Item'}</p>
                    <p className="font-technical-sm text-[10px] opacity-40 uppercase">Recipient: {order.customerName}</p>
                    <p className="font-technical-sm text-[10px] opacity-40 uppercase">Loyalty Status: Verified Account</p>
                  </div>
                  <p className="font-technical-sm text-sm">{formatPrice(order.amount)}</p>
               </div>

               <div className="mt-20 bg-surface-container p-10 space-y-8">
                  <div>
                     <p className="font-technical-sm text-[10px] text-brand-red font-bold mb-3 tracking-widest uppercase">Live Assistance</p>
                     <p className="font-body text-sm opacity-70 leading-relaxed">
                        Our logistical team is standing by to assist with specific delivery requirements or route modifications for your piece ({order.id}).
                     </p>
                  </div>
                  <a 
                    href={WHATSAPP_LINK(`Hello DLNZ, I am tracking my Order ID: ${order.id}. Could you please helper coordinate delivery details?`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-4 bg-brand-red text-white px-10 py-5 font-technical-sm text-[10px] uppercase tracking-widest font-bold active:scale-95 transition-all hover:brightness-110"
                  >
                     <span>Contact Support</span>
                     <ExternalLink className="w-4 h-4" />
                  </a>
               </div>

               {(order.status === 'Processing' || order.status === 'Hold') && (
                 <div className="mt-8 border border-brand-red/25 bg-red-950/10 p-8 space-y-4 font-sans">
                    <div>
                        <p className="font-technical-sm text-[10px] text-brand-red font-bold tracking-widest uppercase">Cancel Order</p>
                        <p className="font-body text-xs opacity-65 leading-relaxed mt-1">
                           You can cancel this order before it is dispatched to the carrier.
                        </p>
                    </div>
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => handleCancelOrder(order.id)}
                      className="inline-flex items-center gap-4 border border-brand-red text-brand-red hover:bg-brand-red hover:text-white px-8 py-4 font-technical-sm text-[10px] uppercase tracking-widest font-bold active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {cancelling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>CANCELLING ORDER...</span>
                        </>
                      ) : (
                        <span>CANCEL ORDER</span>
                      )}
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="min-h-[350px] border border-outline-variant/20 bg-surface-container-lowest p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-brand-charcoal border border-outline-variant/30 flex items-center justify-center mb-6">
            <Package className="w-5 h-5 text-brand-red animate-pulse" />
          </div>
          <h2 className="font-display text-2xl uppercase mb-3 tracking-tighter">No Active Lookup</h2>
          <p className="font-technical-sm text-[10px] uppercase opacity-40 max-w-xs tracking-widest leading-relaxed">
            Please enter your unique Order ID in the query panel above to track your order.
          </p>
        </div>
      )}

      {/* If logged in, show User Orders History at the bottom */}
      {user ? (
        <section className="mt-20 border-t border-outline-variant/35 pt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl uppercase tracking-tight">Your Order Vault</h2>
              <p className="font-technical-sm text-[10px] text-on-surface-variant opacity-60 uppercase mt-1 tracking-widest">
                AUTOMATICALLY RETRIEVED DIGITAL REGISTER FOR {user.email}
              </p>
            </div>
            <span className="font-technical text-xs text-brand-red font-bold uppercase tracking-widest select-none bg-brand-red/10 border border-brand-red/20 px-3 py-1">
              OBSIDIAN LOYALTY STATUS
            </span>
          </div>

          {fetchingUserOrders ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-brand-red animate-spin mr-3" />
              <span className="font-technical-sm text-xs opacity-60 uppercase tracking-widest">QUERYING DEEP STORAGE LEDGER...</span>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="border border-outline-variant/20 bg-brand-charcoal p-12 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
              <p className="font-display text-lg uppercase mb-2">No Registered Orders</p>
              <p className="font-technical-sm text-[10px] opacity-40 uppercase max-w-xs tracking-widest leading-relaxed">
                You have not registered any digital client orders. Explore our current collections to acquire seasonal pieces.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-outline-variant/30 bg-[#070707] rounded-none custom-scrollbar">
              <table className="w-full text-left border-collapse font-technical-sm text-[11px] uppercase tracking-wider min-w-[650px]">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-brand-charcoal opacity-60 text-primary-light">
                    <th className="p-4 md:p-5 font-bold">Order ID</th>
                    <th className="p-4 md:p-5 font-bold">Creation Date</th>
                    <th className="p-4 md:p-5 font-bold">Tracking Code</th>
                    <th className="p-4 md:p-5 font-bold">Value</th>
                    <th className="p-4 md:p-5 font-bold">Carrier Dispatch</th>
                    <th className="p-4 md:p-5 font-bold text-center">Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {userOrders.map((itm) => (
                    <tr 
                      key={itm.id} 
                      className={cn(
                        "hover:bg-brand-charcoal/30 transition-colors",
                        activeOrderId === itm.id ? "bg-brand-red/5 text-brand-red" : "text-primary"
                      )}
                    >
                      <td className="p-4 md:p-5 font-mono font-bold">{itm.id}</td>
                      <td className="p-4 md:p-5 opacity-70">{itm.date}</td>
                      <td className="p-4 md:p-5 font-mono text-brand-ring hover:text-brand-red transition-colors select-all font-semibold" title="Copy tracking code">
                        {itm.tracking || 'TRK-PENDING'}
                      </td>
                      <td className="p-4 md:p-5 font-bold text-white">{formatPrice(itm.amount)}</td>
                      <td className="p-4 md:p-5">
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-bold tracking-widest font-technical",
                          itm.status === 'Delivered' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          itm.status === 'Shipped' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          itm.status === 'Hold' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                          itm.status === 'Cancelled' ? "bg-zinc-800/10 text-zinc-500 border border-zinc-500/20 opacity-50" :
                          "bg-brand-red/10 text-brand-red border border-brand-red/20"
                        )}>
                          {itm.status || 'Processing'}
                        </span>
                      </td>
                      <td className="p-4 md:p-5 text-center">
                        <button
                          onClick={() => {
                            setActiveOrderId(itm.id);
                            setOrderIdInput(itm.id);
                            window.scrollTo({ top: 100, behavior: 'smooth' });
                          }}
                          className="bg-primary text-black hover:bg-brand-red hover:text-white px-4 py-2 font-technical-sm font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Locate Piece
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-20 border-t border-outline-variant/35 pt-16 text-center max-w-xl mx-auto">
          <p className="font-technical-sm text-[10px] text-on-surface-variant opacity-60 uppercase mb-4 tracking-widest">
            HAVE AN ACCOUNT WITH SYSTEM SECURED PROFILE?
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="border border-outline-variant/30 hover:bg-white hover:text-black font-technical-sm text-[10px] uppercase px-8 py-3.5 tracking-widest transition-all cursor-pointer"
          >
            Sign In to Fetch Order Vault
          </button>
        </section>
      )}
    </div>
  );
};
