import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { Logo } from './Logo';
import { useAuth } from './FirebaseProvider';
import { useCart } from './CartProvider';
import { useTheme } from './ThemeContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin: isUserAdmin, setIsAuthModalOpen } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();

  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
    <header className={cn(
      "fixed top-0 w-full z-50 border-b px-3 sm:px-6 md:px-16 h-16 flex justify-between items-center shadow-lg transition-colors duration-300",
      theme === 'light' 
        ? "bg-white border-outline-variant/20 text-black" 
        : "bg-[#0c0c0c] border-b border-outline-variant/30 text-white"
    )}>
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
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex flex-col items-center group transition-all duration-300",
          isSearchOpen ? "hidden md:flex" : "flex"
        )}
      >
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-1 sm:gap-3 md:gap-4">
        {/* Expanding Search Bar */}
        <div ref={searchRef} className="relative flex items-center">
          <motion.form 
            animate={{ 
              width: isSearchOpen ? (isMobile ? 120 : 200) : 34,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
                setIsSearchOpen(false);
              }
            }}
            className={cn(
              "overflow-hidden flex items-center border h-8 transition-colors duration-200",
              isSearchOpen 
                ? "bg-brand-charcoal border-outline-variant/30 px-2 sm:px-3" 
                : "bg-transparent border-transparent px-1"
            )}
          >
            {isSearchOpen && (
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isMobile ? "SEARCH..." : "SEARCH ENGINE..."}
                className="bg-transparent border-none text-[9px] sm:text-[10px] uppercase font-technical-sm text-primary placeholder:opacity-25 focus:ring-0 outline-none w-full mr-2"
                autoFocus
              />
            )}
            <button 
              type="button"
              onClick={() => {
                if (!isSearchOpen) {
                  setIsSearchOpen(true);
                } else {
                  if (searchQuery.trim()) {
                    navigate(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
                    setIsSearchOpen(false);
                  } else {
                    setIsSearchOpen(false);
                  }
                }
              }}
              className="text-primary hover:text-brand-red opacity-80 cursor-pointer p-0.5 flex items-center justify-center"
              title="Search Inventory"
            >
              <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 cursor-pointer" />
            </button>
          </motion.form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {isSearchOpen && matchedCategories.length > 0 && searchQuery.trim() !== '' && (
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
          </AnimatePresence>
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="text-primary hover:scale-105 active:scale-95 transition-transform p-1 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center relative focus:outline-none"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black hover:text-brand-red transition-colors cursor-pointer" />
          ) : (
            <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white hover:text-brand-red transition-colors cursor-pointer" />
          )}
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
              className={cn(
                "fixed top-0 left-0 h-full w-80 z-50 border-r p-8 flex flex-col shadow-2xl transition-colors duration-300",
                theme === 'light' 
                  ? "bg-white border-outline-variant/20 text-black" 
                  : "bg-black border-outline-variant/30 text-white"
              )}
            >
              <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20 mb-8 sm:mb-10">
                <div className="flex flex-col">
                  <span className="font-display font-black text-xs tracking-[0.25em] text-brand-red uppercase">DLNZ</span>
                  <span className="font-technical text-[8px] opacity-40 uppercase tracking-widest">STREET FASHION</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-primary hover:text-brand-red hover:rotate-90 transition-all duration-300 cursor-pointer p-1"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-6 flex-grow">
                {navLinks.map((link, idx) => {
                  const isCurrent = location.pathname === link.href;
                  return (
                    <motion.div
                      key={link.label}
                      whileHover={{ x: 8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Link
                        to={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "group flex items-center gap-4 py-2 outline-none",
                          isCurrent ? "pointer-events-none" : ""
                        )}
                      >
                        {/* Number indicator */}
                        <span className={cn(
                          "font-technical text-[10px] tracking-widest select-none transition-colors duration-300",
                          isCurrent 
                            ? "text-brand-red font-bold" 
                            : "opacity-30 group-hover:opacity-70 text-primary"
                        )}>
                          0{idx + 1}
                        </span>
                        
                        {/* Main title */}
                        <span className={cn(
                          "font-display text-2xl sm:text-3xl uppercase tracking-tighter transition-all duration-300 relative",
                          isCurrent 
                            ? "text-brand-red font-black" 
                            : "font-bold text-primary opacity-80 group-hover:opacity-100 group-hover:text-brand-red"
                        )}>
                          {link.label}
                          
                          {/* Highlight bar indicator */}
                          {isCurrent && (
                            <motion.span 
                              layoutId="activeSideIndicator"
                              className="absolute -bottom-1 left-0 w-8 h-[2px] bg-brand-red"
                            />
                          )}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className={cn(
                "mt-auto pt-6 border-t flex flex-col gap-6",
                theme === 'light' ? "border-outline-variant/20" : "border-outline-variant/30"
              )}>
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className={cn(
                      "p-4 border flex items-center justify-between rounded-sm backdrop-blur-md transition-colors duration-300",
                      theme === 'light' 
                        ? "bg-stone-50 border-outline-variant/20" 
                        : "bg-[#0b0b0b] border-outline-variant/30"
                    )}>
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} className="w-9 h-9 rounded-full border border-outline-variant/30" alt={user.displayName || ''} />
                        ) : (
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center border",
                            theme === 'light' 
                              ? "bg-white border-outline-variant/30 text-black" 
                              : "bg-brand-charcoal border-outline-variant/30 text-white"
                          )}>
                            <UserIcon className="w-4.5 h-4.5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-display font-bold text-[10px] uppercase tracking-wider text-primary truncate max-w-[130px]">{user.displayName || user.email?.split('@')[0]}</span>
                          <span className="font-technical text-[7px] brightness-75 uppercase tracking-widest">{isUserAdmin ? 'Systems Lead' : 'Loyalty Level: Obsidian'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center gap-2 font-technical text-[9px] uppercase tracking-widest hover:text-brand-red transition-all cursor-pointer hover:translate-x-1 duration-200 py-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }}
                    className="group flex items-center justify-between border border-brand-red/30 hover:border-brand-red h-11 px-4 cursor-pointer hover:bg-brand-red/5 transition-all text-left"
                  >
                    <span className="font-technical text-[9px] uppercase tracking-widest text-primary font-bold">Sign In</span>
                    <UserIcon className="w-4 h-4 text-brand-red group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {isUserAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="font-technical text-[9px] text-center border border-outline-variant/40 hover:border-brand-red hover:text-brand-red py-2.5 uppercase tracking-widest transition-all duration-300 font-bold bg-transparent"
                  >
                    Admin Control Console
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
