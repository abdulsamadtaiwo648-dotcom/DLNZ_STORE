import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, MessageSquare, Loader2, CreditCard, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem } from '../types';
import { useAuth } from './FirebaseProvider';
import { orderService } from '../services/orderService';
import { WHATSAPP_LINK } from '../constants';
import { cn } from '../lib/utils';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, change: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setIsAuthModalOpen } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // Form fields for digital order
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  // Checkout status
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('dlnz-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Error parsing cart contents:', err);
      }
    }
  }, []);

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('dlnz-cart', JSON.stringify(newCart));
  };

  const addToCart = (product: Product, size: string, quantity = 1) => {
    const itemIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedSize === size
    );

    if (itemIndex > -1) {
      const nextCart = [...cart];
      nextCart[itemIndex].quantity += quantity;
      saveCart(nextCart);
    } else {
      saveCart([...cart, { product, selectedSize: size, quantity }]);
    }
    // Automatically open the cart drawer when adding an item!
    setIsCartOpen(true);
    // Reset checkout forms
    setIsCheckingOut(false);
    setOrderSuccessId(null);
  };

  const removeFromCart = (productId: string, size: string) => {
    const nextCart = cart.filter(
      item => !(item.product.id === productId && item.selectedSize === size)
    );
    saveCart(nextCart);
  };

  const updateQuantity = (productId: string, size: string, change: number) => {
    const nextCart = cart.map(item => {
      if (item.product.id === productId && item.selectedSize === size) {
        const nextQty = item.quantity + change;
        return { ...item, quantity: nextQty < 1 ? 1 : nextQty };
      }
      return item;
    });
    saveCart(nextCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Track field defaults if user logs in
  useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || '');
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Option A checkout (WhatsApp Order Breakdown)
  const handleWhatsAppCheckout = () => {
    const cartSummary = cart.map(
      item => `- ${item.product.name} [Size: ${item.selectedSize}] x ${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const message = `Hello DLNZ, I would like to place an order for the following collector items:

${cartSummary}

Subtotal: ₦${subtotal.toLocaleString()}
Customer: ${customerName || user?.displayName || 'Guest'} (${customerEmail || user?.email || 'N/A'})
Shipping: ${shippingAddress || 'To be specified'}

Please advise on carrier scheduling and completion of purchase.`;

    window.open(WHATSAPP_LINK(message), '_blank');
  };

  // Option B checkout (Firestore Registered Order)
  const handleDigitalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!customerName || !customerEmail || !shippingAddress) {
      alert('Please compile all delivery fields to finalize verification.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderId = await orderService.createOrder({
        customerName,
        customerEmail,
        userId: user.uid,
        amount: subtotal,
        status: 'Processing',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        tracking: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`
      });

      if (orderId) {
        // Order succeeded!
        setOrderSuccessId(orderId);
        clearCart();
      } else {
        alert('Verification system rejected order creation. Please verify network.');
      }
    } catch (err) {
      console.error('Failed to register order in databases:', err);
      alert('System Exception: Failed to register digital order document.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      totalItems,
      subtotal
    }}>
      {children}

      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
              id="cart-backdrop"
            />

            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-surface z-50 border-l border-outline-variant/30 flex flex-col shadow-2xl"
              id="cart-drawer"
            >
              <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center bg-brand-charcoal">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-brand-red" />
                  <span className="font-display text-lg uppercase tracking-tight">Your Piece Cart</span>
                  <span className="font-technical-sm text-[10px] bg-white/10 text-primary-light px-2 py-0.5 rounded-full">{totalItems}</span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-primary hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                {orderSuccessId ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 flex flex-col items-center justify-center h-full gap-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary flex items-center justify-center">
                      <Check className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl uppercase tracking-tighter mb-3">Order Registered Successfully</h3>
                      <p className="font-technical-sm text-[10px] uppercase opacity-40 max-w-xs tracking-widest leading-relaxed">
                        DIGITAL REGISTRY LOG PREPARED. LOGISTICAL AGENTS ARE COMMISSIONING CARRIERS.
                      </p>
                    </div>

                    <div className="w-full bg-brand-charcoal border border-outline-variant/30 p-6 space-y-4 text-left">
                      <div className="flex justify-between border-b border-white/10 pb-3">
                        <span className="font-technical-sm text-[10px] opacity-40 uppercase">Tracking ID</span>
                        <span className="font-technical-sm text-[10px] text-brand-red font-bold">{orderSuccessId}</span>
                      </div>
                      <p className="font-body text-xs opacity-70 leading-relaxed">
                        Your secure digital voucher is registered in our network. You can track status immediately on the tracking page.
                      </p>
                    </div>

                    <div className="w-full space-y-3">
                      <button 
                        onClick={() => {
                          const userMsg = `Hello DLNZ, I just registered Order ID ${orderSuccessId} on your system. Please organize carrier fulfillment.`;
                          window.open(WHATSAPP_LINK(userMsg), '_blank');
                        }}
                        className="w-full bg-brand-red hover:brightness-110 text-white font-technical-sm text-[10px] uppercase py-4 tracking-widest font-bold flex items-center justify-center gap-3 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message Support on WA
                      </button>
                      <button 
                        onClick={() => {
                          setIsCartOpen(false);
                          setOrderSuccessId(null);
                          setIsCheckingOut(false);
                        }}
                        className="w-full border border-outline-variant/30 hover:bg-white hover:text-black font-technical-sm text-[10px] uppercase py-4 tracking-widest transition-all"
                      >
                        Back to Shop
                      </button>
                    </div>
                  </motion.div>
                ) : cart.length === 0 ? (
                  <div className="text-center py-32 flex flex-col items-center justify-center h-full gap-6">
                    <ShoppingBag className="w-12 h-12 text-primary opacity-25" />
                    <div>
                      <h3 className="font-display text-xl uppercase tracking-tight">Your Cart is Vacant</h3>
                      <p className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest mt-2 max-w-[240px] mx-auto leading-relaxed">
                        Commission modern collector items from our available seasonal collections.
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-8 py-4 border border-outline-variant/30 font-technical-sm text-[10px] uppercase tracking-widest hover:border-primary transition-colors cursor-pointer"
                    >
                      Browse Designs
                    </button>
                  </div>
                ) : !isCheckingOut ? (
                  // Cart items list
                  <div className="space-y-6">
                    {cart.map((item, index) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={`${item.product.id}-${item.selectedSize}`}
                        className="flex gap-4 border-b border-outline-variant/10 pb-6"
                      >
                        <div className="w-20 aspect-[3/4] bg-brand-charcoal overflow-hidden border border-outline-variant/30 flex-shrink-0">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                        </div>
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-display text-sm uppercase tracking-tight text-primary">{item.product.name}</h4>
                              <button 
                                onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                                className="text-on-surface-variant opacity-40 hover:opacity-100 hover:text-brand-red transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="font-technical-sm text-[8px] opacity-40 uppercase tracking-widest mt-1">
                              SIZE: <span className="text-white font-bold">{item.selectedSize}</span> / CAT: {item.product.category}
                            </p>
                          </div>

                          <div className="flex justify-between items-end mt-4">
                            <div className="flex items-center gap-3 border border-outline-variant/30 px-2 py-1">
                              <button 
                                onClick={() => updateQuantity(item.product.id, item.selectedSize, -1)}
                                className="text-primary hover:text-brand-red p-1 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-technical text-xs w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.id, item.selectedSize, 1)}
                                className="text-primary hover:text-brand-red p-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-technical text-xs text-primary">₦{(item.product.price * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // Checkout panel
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <button 
                      onClick={() => setIsCheckingOut(false)}
                      className="text-[10px] font-technical-sm uppercase opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2 mb-6"
                    >
                      ← Back to Cart Contents
                    </button>

                    <form onSubmit={handleDigitalCheckout} className="space-y-5">
                      <div>
                        <label className="font-technical-sm text-[9px] uppercase tracking-widest opacity-40 block mb-2">Recipient Name</label>
                        <input 
                          type="text" 
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="E.G. TAID SAMAD"
                          className="w-full bg-brand-charcoal text-primary border border-outline-variant/30 px-4 py-3 text-xs uppercase tracking-wider font-technical-sm placeholder:opacity-20 outline-none focus:border-brand-red transition-colors"
                        />
                      </div>
                      <div>
                        <label className="font-technical-sm text-[9px] uppercase tracking-widest opacity-40 block mb-2">Secure Email</label>
                        <input 
                          type="email" 
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="SAMAD@DOMAIN.COM"
                          className="w-full bg-brand-charcoal text-primary border border-outline-variant/30 px-4 py-3 text-xs tracking-wider font-technical-sm placeholder:opacity-20 outline-none focus:border-brand-red transition-colors"
                        />
                      </div>
                      <div>
                        <label className="font-technical-sm text-[9px] uppercase tracking-widest opacity-40 block mb-2">Delivery Address Coordinate</label>
                        <textarea
                          required
                          rows={3}
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="CORNER ROAD, LAGOS, NIGERIA"
                          className="w-full bg-brand-charcoal text-primary border border-outline-variant/30 px-4 py-3 text-xs uppercase tracking-wider font-technical-sm placeholder:opacity-20 outline-none focus:border-brand-red transition-colors resize-none"
                        />
                      </div>

                      <div className="pt-4 border-t border-white/50 space-y-4">
                        {!user ? (
                          <div className="text-center p-4 bg-brand-charcoal border border-outline-variant/30 space-y-3">
                            <p className="font-technical-sm text-[9px] uppercase opacity-60 leading-normal">
                              Order registration requires a verified user account.
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsAuthModalOpen(true)}
                              className="font-technical-sm text-[9px] uppercase font-bold tracking-widest bg-white text-black px-6 py-2"
                            >
                              Sign In / Register
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <button
                              type="submit"
                              disabled={isSubmittingOrder}
                              className="w-full bg-primary text-black font-technical-sm text-[10px] uppercase py-4 tracking-widest font-bold flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-primary-light disabled:opacity-50 cursor-pointer"
                            >
                              {isSubmittingOrder ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Registering Order...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4" />
                                  Register Digitally / Pay
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleWhatsAppCheckout}
                              className="w-full bg-brand-red text-white font-technical-sm text-[10px] uppercase py-4 tracking-widest font-bold flex items-center justify-center gap-3 active:scale-95 transition-all hover:brightness-110 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Checkout Via WhatsApp
                            </button>
                          </div>
                        )}
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>

              {/* Drawer Footer summary */}
              {cart.length > 0 && !orderSuccessId && (
                <div className="p-8 border-t border-outline-variant/30 bg-brand-charcoal space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-technical-sm text-[10px] uppercase opacity-40 tracking-[0.2em]">Estimated Total</span>
                    <span className="font-display text-2xl text-primary font-bold">₦{subtotal.toLocaleString()}</span>
                  </div>

                  {!isCheckingOut ? (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsCheckingOut(true)}
                        className="flex-grow bg-white text-black font-technical-sm text-[10px] uppercase py-5 tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleWhatsAppCheckout}
                        title="Quick WhatsApp Dispatch"
                        className="px-6 bg-brand-red text-white py-5 flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
