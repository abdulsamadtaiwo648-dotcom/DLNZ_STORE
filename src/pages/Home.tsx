import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { FlareIcon } from '../components/Icons';
import { Logo } from '../components/Logo';
import { useCurrency } from '../components/CurrencyContext';

export const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const unsubscribe = productService.subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const featured = products.filter(p => p.featured).length >= 3 
    ? products.filter(p => p.featured) 
    : products.slice(0, 3);
  const limited = products.filter(p => p.limited).length > 0
    ? products.filter(p => p.limited)
    : products.slice(3, 7);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_7XXosnXMZkEvj-Z831vNeOWLAMefn3dLklSNkHnMG3gpdNyMBHqExIUUsI1B69_d5-h-bXFc_HfuE1LRuDvCeIagVR3ltMJGJV4v48LU9EYSJHPzT3QN8f3iwGipV3qqIrg14ckqRNp3owN4Q3P6cb81ArQ0gSrukP5GuE94Oq_S8d8ttTLBKry66iaGCW4DETCYi-2gOtGIy6L74W81GS3ijjo4QE5imPHxKxuqmoUXgYatoxOdTYY9Ci1mdu2fzH8VMX2NS5E" 
        />
        <div className="relative z-20 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Logo size="lg" className="mb-12" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-technical-sm text-label-xs text-white uppercase tracking-[0.5em] mb-12"
          >
            GLOBAL LUXURY / SS26
          </motion.p>
          <Link to="/collections">
            <button className="bg-brand-red text-white px-12 py-5 font-technical-sm text-label-xs uppercase tracking-widest active:scale-95 transition-transform hover:brightness-110">
              SHOP NOW
            </button>
          </Link>
        </div>
      </section>

      {/* New Drops - Bento Grid */}
      <section className="py-24 md:py-32 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-16">
          <h2 className="font-display text-4xl md:text-5xl uppercase border-l-4 border-brand-red pl-6 leading-none">New Drops</h2>
          <span className="font-technical-sm text-label-xs opacity-50 tracking-widest hidden md:block">Available Now</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Featured */}
          <Link 
            to={featured[0]?.id ? `/product/${featured[0].id}` : '/collections'}
            className="md:col-span-8 group relative overflow-hidden aspect-[4/5] md:aspect-auto md:h-[600px] border border-outline-variant/30 block cursor-pointer"
          >
            <img 
              alt="Drop 1" 
              className={`w-full h-full object-cover transition-all duration-700 ${
                featured[0]?.hoverImage ? 'group-hover:opacity-0 group-hover:scale-102' : 'group-hover:scale-105'
              }`} 
              src={featured[0]?.image} 
            />
            {featured[0]?.hoverImage && (
              <img 
                alt="Drop 1 Alternate" 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-0 scale-102 group-hover:opacity-100 group-hover:scale-105 pointer-events-none" 
                src={featured[0]?.hoverImage} 
              />
            )}
            <div className="absolute bottom-10 left-10 z-20">
              <p className="font-technical-sm text-[10px] bg-black/80 text-white px-3 py-1 mb-3 inline-block">SS24-JK01</p>
              <h3 className="font-display text-3xl md:text-4xl text-white uppercase group-hover:text-brand-red transition-colors">{featured[0]?.name}</h3>
              <p className="font-technical-sm text-label-xs text-white mt-1">{featured[0]?.price ? formatPrice(featured[0].price) : ''}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </Link>

          {/* Secondary Drops */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <Link 
              to={featured[1]?.id ? `/product/${featured[1].id}` : '/collections'}
              className="group relative overflow-hidden aspect-square border border-outline-variant/30 block cursor-pointer"
            >
              <img 
                alt="Drop 2" 
                className={`w-full h-full object-cover grayscale transition-all duration-700 ${
                  featured[1]?.hoverImage ? 'group-hover:opacity-0 group-hover:scale-102' : 'group-hover:scale-105 group-hover:grayscale-0'
                }`} 
                src={featured[1]?.image} 
              />
              {featured[1]?.hoverImage && (
                <img 
                  alt="Drop 2 Alternate" 
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-0 scale-102 group-hover:opacity-100 group-hover:scale-105 pointer-events-none" 
                  src={featured[1]?.hoverImage} 
                />
              )}
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="font-technical-sm text-label-xs text-white uppercase font-bold group-hover:text-brand-red transition-colors">{featured[1]?.name}</h3>
                <p className="font-technical-sm text-[10px] text-white/70">{featured[1]?.price ? formatPrice(featured[1].price) : ''}</p>
              </div>
            </Link>
            <Link 
              to={featured[2]?.id ? `/product/${featured[2].id}` : '/collections'}
              className="group relative overflow-hidden aspect-square border border-outline-variant/30 block cursor-pointer"
            >
              <img 
                alt="Drop 3" 
                className={`w-full h-full object-cover grayscale transition-all duration-700 ${
                  featured[2]?.hoverImage ? 'group-hover:opacity-0 group-hover:scale-102' : 'group-hover:scale-105 group-hover:grayscale-0'
                }`} 
                src={featured[2]?.image} 
              />
              {featured[2]?.hoverImage && (
                <img 
                  alt="Drop 3 Alternate" 
                  className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-0 scale-102 group-hover:opacity-100 group-hover:scale-105 pointer-events-none" 
                  src={featured[2]?.hoverImage} 
                />
              )}
              <div className="absolute bottom-6 left-6 z-20">
                <h3 className="font-technical-sm text-label-xs text-white uppercase font-bold group-hover:text-brand-red transition-colors">{featured[2]?.name}</h3>
                <p className="font-technical-sm text-[10px] text-white/70">{featured[2]?.price ? formatPrice(featured[2].price) : ''}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Limited Editions */}
      <section className="py-24 md:py-32 bg-surface-container-lowest border-y border-outline-variant/20">
        <div className="px-6 md:px-16 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6">
            <h2 className="font-display text-4xl uppercase leading-none">Limited Editions</h2>
            <p className="font-technical-sm text-label-xs max-w-xs opacity-60">LIMITED PIECES REIMAGINED. ONCE GONE, THEY NEVER RETURN.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {limited.slice(0, 4).map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="flex flex-col gap-6 group">
                <div className="relative aspect-[3/4] overflow-hidden bg-surface-container border border-outline-variant/10">
                  <img 
                    alt={item.name} 
                    className={`w-full h-full object-cover grayscale transition-all duration-500 ${
                      item.hoverImage ? 'group-hover:opacity-0 group-hover:scale-102' : 'group-hover:grayscale-0 group-hover:scale-105'
                    }`} 
                    src={item.image} 
                  />
                  {item.hoverImage && (
                    <img 
                      alt={`${item.name} Alternate`} 
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-0 scale-102 group-hover:opacity-100 group-hover:scale-105 pointer-events-none" 
                      src={item.hoverImage} 
                    />
                  )}
                  {item.stock === 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="border border-primary px-3 py-1 font-technical-sm text-[8px] uppercase bg-black text-white">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-technical-sm text-[10px] uppercase opacity-50 mb-1">{item.category}</p>
                    <h4 className="font-body font-bold uppercase tracking-wide text-sm">{item.name}</h4>
                  </div>
                  <span className="font-technical-sm text-[10px] opacity-70">{formatPrice(item.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 md:py-32 px-6 md:px-16 max-w-2xl mx-auto text-center">
        <h3 className="font-display text-4xl uppercase mb-8">Join the Community</h3>
        <p className="font-body text-brand-silver opacity-70 mb-12">Receive exclusive early access to drops and private collection previews.</p>
        <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
          <input 
            className="flex-grow bg-transparent border-b border-outline-variant py-4 font-technical-sm text-label-xs focus:outline-none focus:border-primary transition-colors text-center md:text-left" 
            placeholder="EMAIL ADDRESS" 
            type="email" 
          />
          <button className="bg-primary text-on-primary px-12 py-4 font-technical-sm text-label-xs uppercase font-bold hover:bg-white transition-colors">
            SUBSCRIBE
          </button>
        </form>
      </section>

    </div>
  );
};
