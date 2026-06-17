import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { Logo } from './Logo';
import { useAuth } from './FirebaseProvider';
import { useCart } from './CartProvider';
import { useCurrency, currencies, CurrencyCode } from './CurrencyContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin: isUserAdmin, setIsAuthModalOpen } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { currencyCode, setCurrency } = useCurrency();

  const currencyRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const navLinks = [
    { label: 'New Arrivals', href: '/' },
    { label: 'Collections', href: '/collections' },
    { label: 'About', href: '/about' },
    { label: 'Tracking', href: '/tracking' },
  ];

  const staticCategories = ['Footwear', 'Clothes', 'Accessories & Jewelry', 'Bags'];
  const matchedCategories = searchQuery.trim()
    ? staticCategories.filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : staticCategories;

  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0c0c0c] border-b border-outline-variant/30 px-3 sm:px-6 md:px-16 h-16 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={() => setIsOpen(true)}
          className="text-primary hover:scale-95 transition-transform"
        >
          <Menu className="w-6 h-6" />
        </button>
        <nav className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={cn(
                "font-technical-sm text-label-xs uppercase tracking-widest transition-all duration-300",
                location.pathname === link.href 
                  ? "text-primary border-b-2 border-brand-red" 
                  : "text-on-background opacity-70 hover:text-primary hover:opacity-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <Link 
        to="/" 
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group transition-all duration-300"
      >
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-1 sm:gap-3 md:gap-4">
        {/* Custom Luxury Currency Selector */}
        <div 
          ref={currencyRef} 
          className="relative transition-all duration-300"
        >
          <button
            onClick={() => {
              setIsCurrencyOpen(!isCurrencyOpen);
              setIsSearchOpen(false);
            }}
            className="flex items-center gap-1 px-1.5 sm:px-3 py-1 sm:py-1.5 font-technical-sm text-[8px] sm:text-[9.5px] uppercase tracking-normal sm:tracking-widest text-primary hover:text-brand-red border border-outline-variant/30 hover:border-brand-red/50 bg-[#0a0a0a] transition-all duration-300 focus:outline-none cursor-pointer"
            title="Switch Currency Protocol"
          >
            <span>{currencyCode}</span>
            {!isMobile && (
              <span className="opacity-40 font-mono"> ({currencies[currencyCode].symbol})</span>
            )}
          </button>
          
          <AnimatePresence>
            {isCurrencyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 bg-[#0c0c0c] border border-outline-variant/30 py-1.5 min-w-[100px] sm:min-w-[130px] shadow-2xl z-50 flex flex-col"
              >
                {(Object.keys(currencies) as CurrencyCode[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setCurrency(code);
                      setIsCurrencyOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 font-technical-sm text-[8px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.15em] uppercase transition-all duration-200 flex justify-between items-center hover:bg-brand-red/10 hover:text-white cursor-pointer",
                      currencyCode === code ? "text-brand-red font-bold" : "text-[#999999]"
                    )}
                  >
                    <span>{currencies[code].label.split(' ')[0]}</span>
                    <span className="opacity-70 font-mono">{currencies[code].symbol}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Input Bar with Autocomplete Suggestions */}
        <div ref={searchRef} className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <div className="relative flex items-center">
                <motion.form 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: isMobile ? 85 : 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      navigate(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
                      setIsSearchOpen(false);
                    }
                  }}
                  className="overflow-hidden flex items-center bg-brand-charcoal border border-outline-variant/30 px-1.5 sm:px-3 py-1 sm:py-1.5 h-8 animate-none"
                >
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isMobile ? "SEARCH..." : "SEARCH ENGINE..."}
                    className="bg-transparent border-none text-[9px] sm:text-[10px] uppercase font-technical-sm text-primary placeholder:opacity-25 focus:ring-0 outline-none w-full"
                    autoFocus
                  />
                  <button type="submit" className="text-primary hover:text-brand-red opacity-60">
                    <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </motion.form>

                {/* Suggestions Dropdown */}
                {matchedCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 bg-[#0c0c0c] border border-outline-variant/30 py-2 w-[130px] sm:w-[180px] shadow-2xl z-50 flex flex-col"
                  >
                    <div className="px-2 sm:px-3 pb-1 border-b border-outline-variant/10 mb-1">
                      <span className="font-technical-sm text-[6.5px] sm:text-[7.5px] uppercase tracking-widest opacity-40 font-bold block">
                        SUGGESTED CATEGORIES
                      </span>
                    </div>
                    {matchedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          navigate(`/collections?category=${encodeURIComponent(cat)}`);
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-left px-2 sm:px-3 py-1 sm:py-1.5 font-technical-sm text-[7.5px] sm:text-[8.5px] tracking-widest uppercase transition-all duration-200 flex items-center justify-between hover:bg-brand-red/10 hover:text-white cursor-pointer group"
                      >
                        <span className="text-on-surface-variant group-hover:text-primary transition-colors truncate">{isMobile && cat === 'Accessories & Jewelry' ? 'Accessories' : cat}</span>
                        {!isMobile && (
                          <span className="text-[7px] font-mono text-brand-red opacity-0 group-hover:opacity-100 transition-opacity">SELECT ↗</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => {
            setIsSearchOpen(!isSearchOpen);
            setIsCurrencyOpen(false);
          }}
          className="text-primary hover:scale-105 active:scale-95 transition-transform p-1 focus:outline-none"
          title="Search Inventory"
        >
          <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 cursor-pointer" />
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="text-primary hover:scale-105 active:scale-95 transition-transform p-1 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center relative focus:outline-none"
          title="View Shopping Cart"
        >
          <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 cursor-pointer" />
          {totalItems > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 sm:-top-1 sm:-right-1 bg-brand-red text-white font-technical text-[7px] sm:text-[8px] font-bold h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full flex items-center justify-center border border-background shadow-lg"
            >
              {totalItems}
            </motion.span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-80 bg-black z-50 border-r border-outline-variant/30 p-10 flex flex-col shadow-2xl"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-primary hover:text-brand-red hover:scale-110 active:scale-95 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mt-20 flex flex-col gap-8 flex-grow">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-4xl uppercase tracking-tighter hover:text-brand-red transition-colors text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="mt-auto pt-10 border-t border-outline-variant/30 flex flex-col gap-6">
                  {user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} className="w-8 h-8 rounded-full border border-outline-variant/30" alt={user.displayName || ''} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-charcoal flex items-center justify-center border border-outline-variant/30">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-technical-sm text-[10px] text-primary">{user.displayName || user.email}</span>
                          <span className="font-technical-sm text-[8px] opacity-40 uppercase tracking-widest">{isUserAdmin ? 'Admin Access' : 'Loyalty Level: Obsidian'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="flex items-center gap-2 font-technical-sm text-label-xs uppercase tracking-widest text-on-surface hover:text-brand-red transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }}
                      className="flex items-center gap-2 font-technical-sm text-label-xs uppercase tracking-widest text-on-surface hover:text-brand-red transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      Sign In / Register
                    </button>
                  )}

                  {isUserAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="font-technical-sm text-label-xs opacity-60 hover:opacity-100 transition-opacity uppercase tracking-[0.2em] text-brand-red"
                    >
                      Admin Console
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
