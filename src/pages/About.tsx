import React from 'react';
import { motion } from 'motion/react';
import { History, Grid, Globe } from 'lucide-react';
import { FlareIcon } from '../components/Icons';
import { useTheme } from '../components/ThemeContext';
import { cn } from '../lib/utils';

export const About = () => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <img 
          className="w-full h-full object-cover grayscale opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL-F7AMWiqK0TupG2VNCZgUIVvIKSTM8-uka4HoUUFnj-J08TY9Wv_MfFTD2apxIMhrisaNOXVPkPrr0spG28cU9AtLQz4paLgEJ4nSKSdBZZaxYRfrehJyVsutsTi7B05YBW5kcn6ls08zDSEpkXxqZEYg0t4j9KLiLfsN-Y2t-t1El7We5eda-GBGAAEuR-xqLOuFtHWlTDTJRngbAAw2kCx8Ycz92nzGSqDlI-2PFsyUTTnKhPVcIBmy0W7j8AGELaBFvGfs9o" 
          alt="DLNZ Editorial Process"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 bg-gradient-to-t from-black via-black/40 to-transparent">
          <div className="max-w-4xl">
            <p className="font-technical-sm text-label-xs text-brand-red mb-6 tracking-[0.3em] font-bold">DRIVEN LIVES, NEW ZONE.</p>
            <h2 className="font-display text-4xl md:text-7xl uppercase leading-[1] mb-10 overflow-hidden text-white">
              DRIVEN LIVES<br />NEW ZONE.<br /><span className="text-white/40">Collections</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className={cn(
        "py-32 px-6 md:px-16 border-b transition-colors",
        theme === 'light' ? "bg-[#FAF8F5] border-black/10" : "bg-background border-outline-variant/30"
      )}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start max-w-7xl mx-auto">
          <div className="md:col-span-7">
            <h3 className={cn(
              "font-display text-2xl md:text-4xl uppercase leading-tight tracking-tight",
              theme === 'light' ? "text-black" : "text-primary"
            )}>
              We build distinctive designs, not just garments. Our vision is a synthesis of aggressive precision and absolute minimalism.
            </h3>
          </div>
          <div className="md:col-span-4 md:col-start-9 space-y-8">
            <p className={cn(
              "font-body text-base leading-relaxed",
              theme === 'light' ? "text-black/80 font-medium" : "text-on-surface-variant/80"
            )}>
              Established in the intersection of high-fashion and technical streetwear, Driven Lives, New Zone. serves those who navigate the urban landscape with quiet confidence. Our heritage is rooted in the brutalist philosophy: form following function with an uncompromising aesthetic.
            </p>
            <div className="w-16 h-[2px] bg-brand-red" />
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className={cn(
        "py-32 px-6 md:px-16 w-full transition-colors",
        theme === 'light' ? "bg-white" : "bg-background"
      )}>
         <div className="max-w-7xl mx-auto">
           <div className="flex justify-between items-end mb-20">
              <div>
                 <span className="font-technical-sm text-[10px] text-brand-red tracking-[0.3em] font-bold">PROCESS</span>
                 <h2 className={cn(
                   "font-display text-3xl md:text-5xl uppercase mt-4",
                   theme === 'light' ? "text-black" : "text-white"
                 )}>Craftsmanship</h2>
              </div>
              <p className={cn(
                "hidden md:block font-technical-sm text-[10px]",
                theme === 'light' ? "text-black/40" : "text-white/30"
              )}>SC-001 / MATERIALS</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[700px]">
              <div className="md:col-span-8 relative overflow-hidden border border-outline-variant/20 group">
                 <img 
                   className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-110" 
                   src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpX6bpX_GoIToRcklFkoZ_ZJtDyPjFbkJX6C7N9iiVV_XPrnGgSU7o1p3JsvbwPXDIJ579NmCOt-ZFhWIHXU7QWjUl2cHIJY5BcOIhGsNlwK1ioZaGEztf3BfOsieYSIiSx7CYNdgRpTtsYCoVDZEYjYDHn9g4gYEZJByU-mgFID81VNFfNdsyZepRZmwgrO8Ig42bV4Oo-0Xb5oOwVNQc9l7Z-aYRycK2TBLTlopNlghfUdcCK-fJ7sWYYxqsLIc_NXf-SNgmKsI" 
                   alt="DLNZ Fabric Pattern"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                 <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-10 md:left-10 max-w-sm text-left">
                    <p className="font-technical-sm text-[10px] mb-3 text-white/60">INTERNAL STRUCTURE</p>
                    <p className="font-body text-sm leading-relaxed text-white">Every seam is reinforced with double-bonded technical nylon for longevity and structural integrity.</p>
                 </div>
              </div>
              <div className="md:col-span-4 grid grid-rows-2 gap-8">
                 <div className={cn(
                   "border p-10 flex flex-col justify-between transition-colors",
                   theme === 'light' 
                     ? "bg-[#FAF8F5] border-black/10 text-black" 
                     : "bg-[#0b0b0b] border-outline-variant/20 text-white"
                 )}>
                    <div className="w-10 h-10 border border-brand-red flex items-center justify-center text-brand-red">
                       <FlareIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display text-2xl uppercase mb-4 leading-none">Silver Series</h4>
                      <p className={cn(
                        "font-body text-sm",
                        theme === 'light' ? "text-black/75" : "text-white/60"
                      )}>Utilizing custom-milled hardware in matte silver finish, resistant to atmospheric erosion.</p>
                    </div>
                 </div>
                 <div className="overflow-hidden border border-outline-variant/20 relative">
                    <img 
                      className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-700" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuArSdWLYNhAemPWrskEpEg4aUm_3-AVo3gJFae4yh0byU3lrfkeId5eQNvvvEoptNu-W41N-XPvjhZw2nhRgZFfmrcPcAHUq_VQWEKAfOal-JDc-IBFu5C7KX4j8wYxDMRbhfti9Rh90EAZFPQ_VT0b2CG3Gn81x5Mg08CPBjG5K3sNrVBudNEslIIDL4Sa6BmST0BOworg1vSaZjSvht2l6MlXy7GARXgiLUI-eCMFdfzKRoKNmdUcOPLCTyFaqFX5dhzHjOIx16M" 
                      alt="DLNZ Production Details"
                    />
                 </div>
              </div>
           </div>
         </div>
      </section>

      {/* Eternal Statement Section */}
      <section className={cn(
         "py-40 text-center border-t transition-all",
         theme === 'light' 
           ? "bg-[#141414] text-white border-black/15" 
           : "bg-[#050505] text-white border-outline-variant/10"
      )}>
         <div className="max-w-3xl mx-auto px-6">
            <h2 className="font-display text-4xl md:text-7xl uppercase leading-[0.9] mb-16">
               The Collection<br />
               <span className="text-brand-red">Is Eternal.</span>
            </h2>
            <p className="font-body text-lg opacity-85 leading-relaxed max-w-2xl mx-auto mb-20 text-brand-silver">
               We reject the cycle of seasonal disposal. Our pieces are designed as modular artifacts, meant to be integrated into a lifelong personal collection. Each garment carries a unique technical ID.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left border-y border-white/10 py-12">
               <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-60">
                     <span className="font-technical-sm text-[10px] text-brand-silver">SUSTAINABLE</span>
                     <History className="w-4 h-4 text-brand-red" />
                  </div>
                  <p className="font-display text-lg uppercase text-white">Precision</p>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-60">
                     <span className="font-technical-sm text-[10px] text-brand-silver">MONOCHROME</span>
                     <Grid className="w-4 h-4 text-brand-red" />
                  </div>
                  <p className="font-display text-lg uppercase text-white">Palette</p>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-60">
                     <span className="font-technical-sm text-[10px] text-brand-silver">GLOBAL</span>
                     <Globe className="w-4 h-4 text-brand-red" />
                  </div>
                  <p className="font-display text-lg uppercase text-white">Community</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};
