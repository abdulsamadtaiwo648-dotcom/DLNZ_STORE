import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, Loader2, Compass, AlertCircle } from 'lucide-react';
import { useAuth } from './FirebaseProvider';

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
          className="relative w-full max-w-md bg-surface-container border border-outline-variant/50 p-8 shadow-2xl z-50 text-primary uppercase"
          id="auth-modal"
        >
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-primary opacity-60 hover:opacity-100 hover:text-brand-red transition-all cursor-pointer"
            title="Close Authentication"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Luxury DLNZ Branding Header */}
          <div className="text-center mb-8">
            <span className="font-technical-sm text-[9px] tracking-[0.3em] opacity-40 block mb-1">
              Verification Engine
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tighter text-white">
              DLNZ FASHION COLLECTIVE
            </h2>
            <div className="h-[2px] w-12 bg-brand-red mx-auto mt-3" />
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex border-b border-outline-variant/30 mb-6">
            <button
              onClick={() => {
                setActiveTab('signin');
                setValidationError(null);
                setAuthError(null);
              }}
              className={`flex-1 pb-3 text-[10px] font-technical-sm font-bold tracking-widest transition-all ${
                activeTab === 'signin' 
                  ? 'text-white border-b-2 border-brand-red opacity-100' 
                  : 'text-primary opacity-40 hover:opacity-75'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setValidationError(null);
                setAuthError(null);
              }}
              className={`flex-1 pb-3 text-[10px] font-technical-sm font-bold tracking-widest transition-all ${
                activeTab === 'signup' 
                  ? 'text-white border-b-2 border-brand-red opacity-100' 
                  : 'text-primary opacity-40 hover:opacity-75'
              }`}
            >
              New Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div>
                <label className="font-technical-sm text-[8px] tracking-widest opacity-40 mb-1.5 block">
                  Full Account Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary/40">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. ABDULSAMAD TAIWO"
                    className="w-full bg-brand-charcoal text-primary border border-outline-variant/30 pl-10 pr-4 py-3 text-xs uppercase tracking-wider font-technical-sm placeholder:opacity-25 outline-none focus:border-brand-red transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-technical-sm text-[8px] tracking-widest opacity-40 mb-1.5 block">
                Email Address Coordinates
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary/40">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USER@DOMAIN.COM"
                  className="w-full bg-brand-charcoal text-primary border border-outline-variant/30 pl-10 pr-4 py-3 text-xs tracking-wider font-technical-sm placeholder:opacity-25 outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="font-technical-sm text-[8px] tracking-widest opacity-40 mb-1.5 block">
                Secure Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-primary/40">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-charcoal text-primary border border-outline-variant/30 pl-10 pr-4 py-3 text-xs tracking-wider font-technical-sm placeholder:opacity-25 outline-none focus:border-brand-red transition-colors"
                />
              </div>
            </div>

            {/* Error notifications */}
            {(validationError || authError) && (
              <div className="bg-brand-red/10 border border-brand-red/30 p-3 text-[9px] font-technical-sm tracking-wide text-red-400 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{validationError || authError}</span>
              </div>
            )}

            {/* Main CTA Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-white/90 text-black font-technical-sm text-[10px] uppercase py-4.5 tracking-widest font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synchronizing Credentials...
                </>
              ) : activeTab === 'signin' ? (
                'Sign In'
              ) : (
                'Construct Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center text-[8px] font-technical-sm opacity-30 tracking-[0.2em]">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <span className="relative bg-surface-container px-3">or authenticate via</span>
          </div>

          {/* Google Sign In option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border border-outline-variant/40 hover:bg-white hover:text-black font-technical-sm text-[10px] uppercase py-4 tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-4 h-4 pr-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google Identity
          </button>

          {/* Helpful Cross-origin Cookie Box constraint */}
          <div className="mt-6 p-4 bg-brand-charcoal border border-outline-variant/30 rounded-xs">
            <div className="flex gap-2.5 items-start">
              <Compass className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
              <div className="text-[8px] font-technical-sm tracking-wide leading-relaxed text-primary-light">
                <span className="font-bold text-white block mb-0.5">Iframe Cookie Restriction Notice</span>
                If third-party security settings bloque registration or sign-in popups inside the preview iframe, please use the <span className="text-white font-bold">Open in New Tab</span> trigger at the top right of the device controls to authorize safely.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
