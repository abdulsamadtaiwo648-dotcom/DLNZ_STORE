import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, Loader2, Compass, AlertCircle } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { useTheme } from './ThemeContext';
import { cn } from '../lib/utils';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    login, 
    loginWithEmail, 
    registerWithEmail, 
    authError, 
    setAuthError 
  } = useAuth();

  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setAuthError(null);
    setValidationError(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setAuthError(null);

    // Initial validations
    if (!email || !password) {
      setValidationError('Please complete all required credentials.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must incorporate at least 6 characters.');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setValidationError('Please specify your profile full name.');
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name.trim());
      }
      // Success - close modal
      handleClose();
    } catch (err: any) {
      // Firebase errors will be caught and populated in authError inside context
      console.error('Auth handler error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await login();
      // On success, close if user authenticated
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Google Sign in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          id="auth-backdrop"
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className={cn(
            "relative w-full max-w-md p-8 sm:p-10 shadow-2xl z-50 uppercase border transition-colors duration-300",
            theme === 'light' 
              ? "bg-[#FCFAF7] border-black/10 text-black animate-none" 
              : "bg-black border-white/10 text-white"
          )}
          id="auth-modal"
        >
          {/* Close button */}
          <button 
            onClick={handleClose}
            className={cn(
              "absolute top-6 right-6 p-1 transition-all duration-300 cursor-pointer",
              theme === 'light' ? "text-black/50 hover:text-brand-red hover:rotate-90" : "text-white/50 hover:text-brand-red hover:rotate-90"
            )}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Luxury DLNZ Branding Header */}
          <div className="text-center mb-10">
            <h2 className={cn(
              "font-display text-4xl font-black tracking-tighter italic leading-none transition-colors duration-300",
              theme === 'light' ? "text-black" : "text-white"
            )}>
              DLNZ
            </h2>
            <span className={cn(
              "font-technical text-[9px] tracking-[0.4em] block mt-2 transition-colors duration-300",
              theme === 'light' ? "text-black/40" : "text-white/40"
            )}>
              STREET FASHION
            </span>
            <div className="h-[1px] w-12 bg-brand-red mx-auto mt-4" />
          </div>

          {/* Interactive Navigation Tabs */}
          <div className={cn(
            "flex border-b mb-8 transition-colors duration-300",
            theme === 'light' ? "border-black/10" : "border-white/10"
          )}>
            <button
              onClick={() => {
                setActiveTab('signin');
                setValidationError(null);
                setAuthError(null);
              }}
              className={cn(
                "flex-1 pb-3 text-[10px] font-technical tracking-[0.15em] font-bold transition-all outline-none",
                activeTab === 'signin' 
                  ? (theme === 'light' ? 'text-black border-b border-brand-red opacity-100' : 'text-white border-b border-brand-red opacity-100')
                  : (theme === 'light' ? 'text-black/40 hover:opacity-80' : 'text-white/40 hover:opacity-80')
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setValidationError(null);
                setAuthError(null);
              }}
              className={cn(
                "flex-1 pb-3 text-[10px] font-technical tracking-[0.15em] font-bold transition-all outline-none",
                activeTab === 'signup' 
                  ? (theme === 'light' ? 'text-black border-b border-brand-red opacity-100' : 'text-white border-b border-brand-red opacity-100')
                  : (theme === 'light' ? 'text-black/40 hover:opacity-80' : 'text-white/40 hover:opacity-80')
              )}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {activeTab === 'signup' && (
              <div>
                <label className={cn(
                  "font-technical text-[8px] tracking-[0.2em] mb-2 block transition-colors duration-300",
                  theme === 'light' ? "text-black/50" : "text-white/40"
                )}>
                  Full Name
                </label>
                <div className="relative">
                  <span className={cn(
                    "absolute inset-y-0 left-0 pl-3 flex items-center transition-colors duration-300",
                    theme === 'light' ? "text-black/30" : "text-white/30"
                  )}>
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. ABDULSAMAD TAIWO"
                    className={cn(
                      "w-full text-xs uppercase tracking-wider font-technical outline-none transition-all duration-300 pl-10 pr-4 py-3.5",
                      theme === 'light' 
                        ? "bg-black/[0.03] text-black border border-black/10 placeholder:text-black/20 focus:border-brand-red" 
                        : "bg-white/[0.03] text-white border border-white/10 placeholder:text-white/10 focus:border-brand-red"
                    )}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={cn(
                "font-technical text-[8px] tracking-[0.2em] mb-2 block transition-colors duration-300",
                theme === 'light' ? "text-black/50" : "text-white/40"
              )}>
                Email Address
              </label>
              <div className="relative">
                <span className={cn(
                  "absolute inset-y-0 left-0 pl-3 flex items-center transition-colors duration-300",
                  theme === 'light' ? "text-black/30" : "text-white/30"
                )}>
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@DOMAIN.COM"
                  className={cn(
                    "w-full text-xs tracking-wider font-technical outline-none transition-all duration-300 pl-10 pr-4 py-3.5",
                    theme === 'light' 
                      ? "bg-black/[0.03] text-black border border-black/10 placeholder:text-black/20 focus:border-brand-red" 
                      : "bg-white/[0.03] text-white border border-white/10 placeholder:text-white/10 focus:border-brand-red"
                  )}
                />
              </div>
            </div>

            <div>
              <label className={cn(
                "font-technical text-[8px] tracking-[0.2em] mb-2 block transition-colors duration-300",
                theme === 'light' ? "text-black/50" : "text-white/40"
              )}>
                Password
              </label>
              <div className="relative">
                <span className={cn(
                  "absolute inset-y-0 left-0 pl-3 flex items-center transition-colors duration-300",
                  theme === 'light' ? "text-black/30" : "text-white/30"
                )}>
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "w-full text-xs tracking-wider font-technical outline-none transition-all duration-300 pl-10 pr-4 py-3.5",
                    theme === 'light' 
                      ? "bg-black/[0.03] text-black border border-black/10 placeholder:text-black/20 focus:border-brand-red" 
                      : "bg-white/[0.03] text-white border border-white/10 placeholder:text-white/10 focus:border-brand-red"
                  )}
                />
              </div>
            </div>

            {/* Error notifications */}
            {(validationError || authError) && (
              <div className="bg-brand-red/10 border border-brand-red/20 p-3.5 text-[9px] font-technical tracking-wide text-brand-red flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validationError || authError}</span>
              </div>
            )}

            {/* Main CTA Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full font-technical text-[10px] uppercase py-4 tracking-[0.2em] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 cursor-pointer mt-4",
                theme === 'light' 
                  ? "bg-black hover:bg-neutral-800 text-white" 
                  : "bg-white hover:bg-neutral-200 text-black"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : activeTab === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={cn(
            "relative my-8 flex items-center justify-center text-[8px] font-technical tracking-[0.2em]",
            theme === 'light' ? "text-black/30" : "text-white/30"
          )}>
            <div className="absolute inset-0 flex items-center">
              <div className={cn(
                "w-full border-t",
                theme === 'light' ? "border-black/10" : "border-white/10"
              )}></div>
            </div>
            <span className={cn(
              "relative px-4 font-bold transition-all",
              theme === 'light' ? "bg-[#FCFAF7]" : "bg-black"
            )}>OR</span>
          </div>

          {/* Google Sign In option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={cn(
              "w-full font-technical text-[10px] uppercase py-3.5 tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer border",
              theme === 'light' 
                ? "border-black/10 hover:border-black hover:bg-black hover:text-white text-black" 
                : "border-white/10 hover:border-white hover:bg-white hover:text-black text-white"
            )}
          >
            <svg className="w-4 h-4 pr-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Helpful Cross-origin Cookie Box constraint */}
          <div className={cn(
            "mt-8 p-4 border rounded-xs transition-colors duration-300",
            theme === 'light' ? "bg-black/[0.02] border-black/5" : "bg-white/[0.02] border-white/5"
          )}>
            <div className="flex gap-2.5 items-start">
              <Compass className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
              <div className={cn(
                "text-[8px] font-technical tracking-wider leading-relaxed",
                theme === 'light' ? "text-black/50" : "text-white/50"
              )}>
                <span className={cn(
                  "font-bold block mb-0.5",
                  theme === 'light' ? "text-black" : "text-white"
                )}>Iframe Restriction Alert</span>
                If third-party cookie controls block registration/sign-in here, please use the <span className={cn("font-bold", theme === 'light' ? "text-black font-semibold" : "text-white font-semibold")}>Open in New Tab</span> action at the top right of your screen.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
