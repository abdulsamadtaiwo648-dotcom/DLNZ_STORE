import React from 'react';
import { motion } from 'motion/react';
import { History, Grid, Globe } from 'lucide-react';
import { FlareIcon } from '../components/Icons';

export const About = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <img 
          className="w-full h-full object-cover grayscale opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL-F7AMWiqK0TupG2VNCZgUIVvIKSTM8-uka4HoUUFnj-J08TY9Wv_MfFTD2apxIMhrisaNOXVPkPrr0spG28cU9AtLQz4paLgEJ4nSKSdBZZaxYRfrehJyVsutsTi7B05YBW5kcn6ls08zDSEpkXxqZEYg0t4j9KLiLfsN-Y2t-t1El7We5eda-GBGAAEuR-xqLOuFtHWlTDTJRngbAAw2kCx8Ycz92nzGSqDlI-2PFsyUTTnKhPVcIBmy0W7j8AGELaBFvGfs9o" 
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 bg-gradient-to-t from-black via-transparent to-transparent">
          <div className="max-w-4xl">
            <p className="font-technical-sm text-label-xs text-primary mb-6 tracking-[0.3em]">DRIVEN LIVES, NEW ZONE.</p>
            <h2 className="font-display text-4xl md:text-7xl uppercase leading-[1] mb-10 overflow-hidden">
              Driven Lives,<br />New Zone<br /><span className="text-on-surface-variant/40">Collections</span>
            </h2>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-32 px-6 md:px-16 border-b border-outline-variant/30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start max-w-7xl mx-auto">
          <div className="md:col-span-7">
            <h3 className="font-display text-2xl md:text-4xl uppercase leading-tight tracking-tight">
              We build distinctive designs, not just garments. Our vision is a synthesis of aggressive precision and absolute minimalism.
            </h3>
          </div>
          <div className="md:col-span-4 md:col-start-9 space-y-8">
            <p className="font-body text-base opacity-70 leading-relaxed">
              Established in the intersection of high-fashion and technical streetwear, DLNZ serves those who navigate the urban landscape with quiet confidence. Our heritage is rooted in the brutalist philosophy: form following function with an uncompromising aesthetic.
            </p>
            <div className="w-16 h-[2px] bg-brand-red" />
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto w-full">
         <div className="flex justify-between items-end mb-20">
            <div>
               <span className="font-technical-sm text-[10px] text-primary tracking-[0.3em]">PROCESS</span>
               <h2 className="font-display text-3xl md:text-5xl uppercase mt-4">Craftsmanship</h2>
            </div>
            <p className="hidden md:block font-technical-sm text-[10px] opacity-30">SC-001 / MATERIALS</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-auto md:h-[700px]">
            <div className="md:col-span-8 relative overflow-hidden border border-outline-variant/20 group">
               <img className="w-full h-full object-cover grayscale transition-transform duration-1000 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpX6bpX_GoIToRcklFkoZ_ZJtDyPjFbkJX6C7N9iiVV_XPrnGgSU7o1p3JsvbwPXDIJ579NmCOt-ZFhWIHXU7QWjUl2cHIJY5BcOIhGsNlwK1ioZaGEztf3BfOsieYSIiSx7CYNdgRpTtsYCoVDZEYjYDHn9g4gYEZJByU-mgFID81VNFfNdsyZepRZmwgrO8Ig42bV4Oo-0Xb5oOwVNQc9l7Z-aYRycK2TBLTlopNlghfUdcCK-fJ7sWYYxqsLIc_NXf-SNgmKsI" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
               <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-10 md:left-10 max-w-sm text-left">
                  <p className="font-technical-sm text-[10px] mb-3 opacity-60">INTERNAL STRUCTURE</p>
                  <p className="font-body text-sm leading-relaxed">Every seam is reinforced with double-bonded technical nylon for longevity and structural integrity.</p>
               </div>
            </div>
            <div className="md:col-span-4 grid grid-rows-2 gap-8">
               <div className="bg-surface-container-low border border-outline-variant/20 p-10 flex flex-col justify-between">
                  <div className="w-10 h-10 border border-brand-red flex items-center justify-center text-brand-red">
                     <FlareIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display text-2xl uppercase mb-4 leading-none">Silver Series</h4>
                    <p className="font-body text-sm opacity-60">Utilizing custom-milled hardware in matte silver finish, resistant to atmospheric erosion.</p>
                  </div>
               </div>
               <div className="overflow-hidden border border-outline-variant/20">
                  <img className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArSdWLYNhAemPWrskEpEg4aUm_3-AVo3gJFae4yh0byU3lrfkeId5eQNvvvEoptNu-W41N-XPvjhZw2nhRgZFfmrcPcAHUq_VQWEKAfOal-JDc-IBFu5C7KX4j8wYxDMRbhfti9Rh90EAZFPQ_VT0b2CG3Gn81x5Mg08CPBjG5K3sNrVBudNEslIIDL4Sa6BmST0BOworg1vSaZjSvht2l6MlXy7GARXgiLUI-eCMFdfzKRoKNmdUcOPLCTyFaqFX5dhzHjOIx16M" />
               </div>
            </div>
         </div>
      </section>

      <section className="py-40 bg-surface-container-lowest text-center border-t border-outline-variant/10">
         <div className="max-w-3xl mx-auto px-6">
            <h2 className="font-display text-4xl md:text-7xl uppercase leading-[0.9] mb-16">
               The Collection<br />
               <span className="text-on-primary-container">Is Eternal.</span>
            </h2>
            <p className="font-body text-lg opacity-60 leading-relaxed max-w-2xl mx-auto mb-20 text-on-surface-variant">
               We reject the cycle of seasonal disposal. Our pieces are designed as modular artifacts, meant to be integrated into a lifelong personal collection. Each garment carries a unique technical ID.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left border-y border-outline-variant/10 py-12">
               <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-40">
                     <span className="font-technical-sm text-[10px]">SUSTAINABLE</span>
                     <History className="w-4 h-4" />
                  </div>
                  <p className="font-display text-lg uppercase">Precision</p>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-40">
                     <span className="font-technical-sm text-[10px]">MONOCHROME</span>
                     <Grid className="w-4 h-4" />
                  </div>
                  <p className="font-display text-lg uppercase">Palette</p>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center opacity-40">
                     <span className="font-technical-sm text-[10px]">GLOBAL</span>
                     <Globe className="w-4 h-4" />
                  </div>
                  <p className="font-display text-lg uppercase">Community</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};
