import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { productService } from '../services/productService';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { MessageSquare, Heart, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';
import { WHATSAPP_LINK } from '../constants';

export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const [currentProduct, allProducts] = await Promise.all([
          productService.getProductById(id),
          productService.getAllProducts()
        ]);
        setProduct(currentProduct);
        if (currentProduct) {
          setRelatedProducts(allProducts.filter(p => p.id !== id && p.category === currentProduct.category).slice(0, 4));
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return <div className="pt-40 text-center font-display text-2xl uppercase">Product not found.</div>;

  const handleWhatsAppCheckout = () => {
    const message = `Hello DLNZ, I would like to order:
    
Product: ${product.name}
SKU: ${product.sku}
Price: ₦${product.price.toLocaleString()}
Size: ${selectedSize}
User: ${user?.email || 'Guest'}

Please confirm availability and payment details.`;

    window.open(WHATSAPP_LINK(message), '_blank');
  };

  const images = product.images || [product.image, product.image, product.image];

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 md:px-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
        {/* Gallery */}
        <div className="md:col-span-7 space-y-6">
          <div className="relative aspect-[3/4] bg-brand-charcoal overflow-hidden group">
            <img 
              alt={product.name} 
              className="w-full h-full object-cover editorial-image-hover" 
              src={images[0]} 
            />
            <div className="absolute bottom-6 left-6 font-technical-sm text-[10px] bg-black/60 backdrop-blur-md px-4 py-2 border border-brand-silver/20 tracking-widest text-primary">
               IMG_01 / PERSPECTIVE_A
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {images.slice(1).map((img, i) => (
              <div key={i} className="aspect-[3/4] bg-brand-charcoal overflow-hidden border border-outline-variant/10">
                <img alt="Detail" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" src={img} />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-5 flex flex-col gap-10">
          <header className="border-b border-brand-silver/10 pb-10">
            <div className="flex justify-between items-start mb-6">
              <span className="font-technical-sm text-[10px] text-on-surface-variant opacity-60 tracking-[0.2em]">DLNZ / SS26 / {product.sku}</span>
              {product.limited && <span className="font-technical-sm text-[10px] text-brand-red font-bold">LIMITED EDITION</span>}
            </div>
            <h1 className="font-display text-4xl md:text-5xl uppercase leading-none mb-4">{product.name}</h1>
            <div className="font-display text-3xl text-primary tracking-tighter">₦{product.price.toLocaleString()}</div>
          </header>

          <div className="space-y-6">
            <p className="font-body text-base text-on-surface leading-relaxed opacity-90">
              {product.description}
            </p>
            <ul className="font-technical-sm text-[10px] text-on-surface-variant space-y-3 opacity-60">
              {product.details?.map((detail, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-primary">—</span>
                  {detail.toUpperCase()}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8 pt-6">
            {/* Size */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-technical-sm tracking-widest opacity-60">
                <span>SELECT SIZE</span>
                <button className="underline underline-offset-4 hover:text-primary transition-colors">SIZE GUIDE</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {['S', 'M', 'L', 'XL'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      "py-4 border font-technical-sm text-xs transition-all",
                      selectedSize === s 
                        ? "border-primary bg-white text-black font-bold" 
                        : "border-outline-variant/30 text-on-surface-variant hover:border-primary"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4">
               <span className="font-technical-sm text-[10px] tracking-widest opacity-60">FINISH</span>
               <div className="flex gap-5">
                 {product.colors?.map((c, i) => (
                   <div 
                     key={i} 
                     className={cn(
                       "w-10 h-10 rounded-full border cursor-pointer ring-offset-4 ring-offset-surface transition-all",
                       i === 0 ? "border-primary ring-2 ring-primary" : "border-outline-variant/30 hover:border-primary"
                     )}
                     style={{ backgroundColor: c }}
                   />
                 )) || <div className="w-10 h-10 rounded-full border border-primary bg-black ring-2 ring-primary ring-offset-2 ring-offset-surface" />}
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-10 border-t border-outline-variant/10">
            <button 
              onClick={handleWhatsAppCheckout}
              className="w-full bg-brand-red text-white font-technical-sm text-xs py-6 flex items-center justify-center gap-4 active:scale-95 transition-all hover:brightness-110 tracking-[0.2em] font-bold"
            >
              <MessageSquare className="w-4 h-4" />
              CHECKOUT VIA WHATSAPP
            </button>
            <button className="w-full border border-brand-silver text-on-surface font-technical-sm text-xs py-6 flex items-center justify-center gap-4 hover:bg-on-surface hover:text-black transition-all tracking-[0.2em]">
               <Heart className="w-4 h-4" />
               ADD TO WISHLIST
            </button>
          </div>

          {/* Accordions */}
          <div className="space-y-2">
            <div className="border-b border-outline-variant/10 py-5 group cursor-pointer">
               <div className="flex justify-between items-center text-xs font-technical-sm tracking-widest uppercase">
                  <span>How it works</span>
                  <ChevronDown className="w-4 h-4 opacity-40 group-hover:translate-y-1 transition-transform" />
               </div>
            </div>
            <div className="border-b border-outline-variant/10 py-5 group cursor-pointer">
               <div className="flex justify-between items-center text-xs font-technical-sm tracking-widest uppercase">
                  <span>Shipping & Returns</span>
                  <Plus className="w-4 h-4 opacity-40 group-hover:rotate-90 transition-transform" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended */}
      {relatedProducts.length > 0 && (
        <section className="mt-40">
           <h2 className="font-display text-3xl uppercase mb-16 tracking-tighter leading-none">Complete the Design</h2>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                 <Link key={item.id} to={`/product/${item.id}`} className="group space-y-6">
                   <div className="aspect-[3/4] bg-brand-charcoal overflow-hidden border border-outline-variant/10 relative">
                      <img alt={item.name} className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" src={item.image} />
                      <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 text-[8px] font-technical-sm tracking-widest">DRIVEN LIFE / FW26 / 0{item.sku}</div>
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-technical-sm text-[10px] tracking-widest group-hover:text-brand-red transition-colors">{item.name}</h4>
                      <p className="font-technical-sm text-[10px] opacity-40">₦{item.price.toLocaleString()}</p>
                   </div>
                 </Link>
              ))}
           </div>
        </section>
      )}
    </div>
  );
};
