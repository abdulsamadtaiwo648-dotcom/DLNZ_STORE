import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { Logo } from './Logo';
import { useAuth } from './FirebaseProvider';
import { useCart } from './CartProvider';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin: isUserAdmin, setIsAuthModalOpen } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();


  const navLinks = [
    { label: 'New Arrivals', href: '/' },
    { label: 'Collections', href: '/collections' },
    { label: 'About', href: '/about' },
    { label: 'Tracking', href: '/tracking' },
  ];

  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0c0c0c] border-b border-outline-variant/30 px-6 md:px-16 h-16 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-4">
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

      <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group">
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-4 relative">
        {/* Search Input Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.form 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 180, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/collections?search=${encodeURIComponent(searchQuery.trim())}`);
                  setIsSearchOpen(false);
                }
              }}
              className="absolute right-16 top-1/2 -translate-y-1/2 overflow-hidden flex items-center bg-brand-charcoal border border-outline-variant/30 px-3 py-1.5"
            >
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH ENGINE..."
                className="bg-transparent border-none text-[10px] uppercase font-technical-sm text-primary placeholder:opacity-25 focus:ring-0 outline-none w-full"
                autoFocus
              />
              <button type="submit" className="text-primary hover:text-brand-red opacity-60">
                <Search className="w-3.5 h-3.5" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="text-primary hover:scale-105 active:scale-95 transition-transform p-1.5 focus:outline-none"
          title="Search Inventory"
        >
          <Search className="w-5 h-5 cursor-pointer" />
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="text-primary hover:scale-105 active:scale-95 transition-transform p-1.5 h-9 w-9 flex items-center justify-center relative focus:outline-none"
          title="View Shopping Cart"
        >
          <ShoppingBag className="w-5 h-5 cursor-pointer" />
          {totalItems > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-brand-red text-white font-technical text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-background shadow-lg"
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
