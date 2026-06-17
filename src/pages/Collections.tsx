import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { ShoppingBag, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';
import { useCart } from '../components/CartProvider';
import { useCurrency } from '../components/CurrencyContext';
import { WHATSAPP_LINK } from '../constants';
import { ProductCurrencyDropdown } from '../components/ProductCurrencyDropdown';


export const Collections = () => {
  const { user } = useAuth();
  const { formatPrice, currencyCode, setCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(() => searchParams.get('category') || 'All');
  const { addToCart } = useCart();

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFilter(cat);
    } else {
      setFilter('All');
    }
  }, [searchParams]);

  const handleCategoryChange = (newCat: string) => {
    setFilter(newCat);
    setSearchParams(prev => {
      if (newCat === 'All') {
        prev.delete('category');
      } else {
        prev.set('category', newCat);
      }
      return prev;
    });
  };

  useEffect(() => {
    const unsubscribe = productService.subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categories = ['All', 'Footwear', 'Clothes', 'Accessories & Jewelry', 'Bags'];
  const sizes = ['S', 'M', 'L', 'XL'];

  let filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => {
        const catUpper = p.category?.toUpperCase() || '';
        if (filter === 'Clothes') {
          return catUpper === 'CLOTHES' || catUpper === 'APPAREL';
        }
        if (filter === 'Accessories & Jewelry') {
          return catUpper === 'ACCESSORIES & JEWELRY' || catUpper === 'ACCESSORIES' || catUpper === 'JEWELRY';
        }
        return catUpper === filter.toUpperCase();
      });

  if (searchQuery.trim()) {
    const queryTerm = searchQuery.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(queryTerm) ||
      p.description.toLowerCase().includes(queryTerm) ||
      p.sku.toLowerCase().includes(queryTerm) ||
      p.category.toLowerCase().includes(queryTerm)
    );
  }

  const handleClearSearch = () => {
    setSearchParams(prev => {
      prev.delete('search');
      return prev;
    });
  };

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-6 md:px-16 min-h-screen">
      <section className="mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="font-technical-sm text-label-xs text-brand-red mb-2 block tracking-widest">Available Now</span>
            <h1 className="font-display text-4xl md:text-7xl uppercase leading-none">Collections</h1>
            {searchQuery && (
              <div className="mt-4 flex items-center gap-3 bg-brand-charcoal border border-outline-variant/30 px-3 py-1.5 inline-flex">
                <span className="font-technical-sm text-[9px] uppercase tracking-wider opacity-60">
                  Search: <span className="text-brand-red font-bold">&quot;{searchQuery}&quot;</span>
                </span>
                <button 
                  onClick={handleClearSearch}
                  className="text-primary hover:text-brand-red p-0.5 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <div className="font-technical-sm text-label-xs opacity-40 pb-2">
            Showing {filteredProducts.length} of {products.length} Items
          </div>
        </div>
        <div className="h-px w-full bg-outline-variant/30 mt-10" />
      </section>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-28 space-y-16">
            <div>
              <h3 className="font-technical-sm text-label-xs tracking-widest mb-6 opacity-60">Category</h3>
              <ul className="space-y-4 select-none">
                {categories.map(cat => (
                  <li 
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "cursor-pointer font-body text-sm uppercase tracking-wide transition-all flex items-center gap-3.5 group py-0.5",
                      filter === cat ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
                    )}
                  >
                    {/* Custom Luxury Checkbox */}
                    <div className={cn(
                      "w-4 h-4 border transition-all flex items-center justify-center flex-shrink-0 duration-200",
                      filter === cat 
                        ? "border-brand-red bg-brand-red/10 animate-pulse" 
                        : "border-outline-variant/40 group-hover:border-[#888888]"
                    )}>
                      {filter === cat && (
                        <div className="w-1.5 h-1.5 bg-brand-red" />
                      )}
                    </div>
                    <span>{cat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <section className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-20 gap-x-8">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  layout 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-surface-container-low relative border border-outline-variant/10">
                    <img 
                      alt={product.name} 
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        product.hoverImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-110'
                      }`} 
                      src={product.image} 
                    />
                    {product.hoverImage && (
                      <img 
                        alt={`${product.name} Alternate`} 
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-0 scale-105 group-hover:opacity-100 group-hover:scale-110 pointer-events-none" 
                        src={product.hoverImage} 
                      />
                    )}
                    
                    {/* Hover State: Quick Add */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-[2px]">
                      <span className="font-technical-sm text-label-xs text-white mb-6 tracking-[0.3em]">QUICK ADD</span>
                      <div className="flex gap-2 flex-wrap justify-center mb-8">
                        {sizes.map(s => (
                          <button 
                            key={s} 
                            onClick={(e) => { e.preventDefault(); addToCart(product, s); }}
                            className="px-3 py-1 border border-white/50 text-white font-technical-sm text-[8px] hover:bg-white hover:text-black transition-colors cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); addToCart(product, 'M'); }}
                        className="w-full py-4 bg-brand-red text-white font-technical-sm text-label-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                         <ShoppingBag className="w-4 h-4" />
                         Add Size M to Cart
                      </button>
                    </div>

                    {product.limited && (
                      <div className="absolute top-4 left-4 border border-brand-red/50 px-3 py-1 bg-black/40 backdrop-blur-sm">
                        <span className="font-technical-sm text-[8px] text-brand-red">LIMITED</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex justify-between items-start">
                    <Link to={`/product/${product.id}`} className="flex-grow group/link">
                      <h4 className="font-display text-lg uppercase tracking-tight group-hover/link:text-brand-red transition-colors">{product.name}</h4>
                      <p className="font-technical-sm text-[10px] opacity-40 mt-1">{product.material || product.category}</p>
                    </Link>
                    <div className="flex flex-col items-end gap-1.5 ml-4">
                      <span className="font-technical-sm text-label-xs text-primary whitespace-nowrap">{formatPrice(product.price)}</span>
                      <ProductCurrencyDropdown darkBg={false} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <div className="mt-32 flex items-center justify-center gap-4">
             <button className="w-10 h-10 border border-outline-variant/30 flex items-center justify-center opacity-30 cursor-not-allowed">
               <span className="font-technical text-lg">←</span>
             </button>
             <button className="w-10 h-10 border border-primary flex items-center justify-center font-technical-sm text-label-xs bg-primary/10">01</button>
             <button className="w-10 h-10 border border-outline-variant/30 flex items-center justify-center font-technical-sm text-label-xs hover:border-primary transition-colors">02</button>
             <button className="w-10 h-10 border border-outline-variant/30 flex items-center justify-center font-technical-sm text-label-xs hover:border-primary transition-colors">03</button>
             <button className="w-10 h-10 border border-outline-variant/30 flex items-center justify-center hover:border-primary transition-colors">
               <span className="font-technical text-lg">→</span>
             </button>
          </div>
        </section>
      </div>
    </div>
  );
};
