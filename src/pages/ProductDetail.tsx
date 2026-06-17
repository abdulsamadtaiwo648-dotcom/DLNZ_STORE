import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { productService } from "../services/productService";
import { Product } from "../types";
import { cn } from "../lib/utils";
import {
  MessageSquare,
  Heart,
  ChevronDown,
  Plus,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../components/FirebaseProvider";
import { useCart } from "../components/CartProvider";
import { useCurrency } from "../components/CurrencyContext";
import { WHATSAPP_LINK } from "../constants";

export const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { formatPrice, currencyCode, setCurrency } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("M");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const [currentProduct, allProducts] = await Promise.all([
          productService.getProductById(id),
          productService.getAllProducts(),
        ]);
        setProduct(currentProduct);
        setCurrentImageIndex(0);
        setSelectedColorIndex(0);
        if (currentProduct) {
          setRelatedProducts(
            allProducts
              .filter(
                (p) => p.id !== id && p.category === currentProduct.category,
              )
              .slice(0, 4),
          );
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

  if (!product)
    return (
      <div className="pt-40 text-center font-display text-2xl uppercase">
        Product not found.
      </div>
    );

  const handleWhatsAppCheckout = () => {
    const colorFinishName =
      product.colors && product.colors.length > 0
        ? product.colors[selectedColorIndex]
        : "DEFAULT";
    const message = `Hello DLNZ, I would like to order:
    
Product: ${product.name}
SKU: ${product.sku}
Price: ${formatPrice(product.price)}
Size: ${selectedSize}
Color/Finish: ${colorFinishName.toUpperCase()}
User: ${user?.email || "Guest"}

Please confirm availability and payment details.`;

    window.open(WHATSAPP_LINK(message), "_blank");
  };

  const images =
    product.images ||
    ([product.image, product.hoverImage].filter(Boolean) as string[]);

  const nextSlide = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="pt-24 pb-32 max-w-7xl mx-auto px-6 md:px-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
        {/* Gallery Slideshow */}
        <div className="md:col-span-7 space-y-6">
          <div className="relative aspect-[3/4] bg-brand-charcoal overflow-hidden border border-outline-variant/20 group">
            {/* Main Current Slide */}
            <div className="w-full h-full relative overflow-hidden">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                alt={product.name}
                className="w-full h-full object-cover"
                src={images[currentImageIndex]}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* View Meta Tag Overlay */}
            <div className="absolute bottom-6 left-6 font-technical-sm text-[9px] bg-black/85 backdrop-blur-md px-4 py-2 border border-brand-silver/20 tracking-widest text-primary font-bold">
              IMG_0{currentImageIndex + 1} / PERSPECTIVE_
              {String.fromCharCode(65 + currentImageIndex)}{" "}
              {product.colors && product.colors[selectedColorIndex]
                ? `/ ${product.colors[selectedColorIndex].toUpperCase()}`
                : ""}
            </div>

            {/* Slider Navigation Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white hover:text-black hover:scale-105 active:scale-95 text-white transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border border-white/20 bg-black/60 hover:bg-white hover:text-black hover:scale-105 active:scale-95 text-white transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Tiny Indicator Bars */}
            {images.length > 1 && (
              <div className="absolute bottom-6 right-6 flex gap-1.5 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "h-1 transition-all duration-300",
                      currentImageIndex === idx
                        ? "w-7 bg-brand-red"
                        : "w-2 bg-white/40 hover:bg-white/70",
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Slide Deck Thumbnails underneath Slider */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentImageIndex(idx);
                    if (product.colors && product.colors.length > idx) {
                      setSelectedColorIndex(idx);
                    }
                  }}
                  className={cn(
                    "aspect-[3/4] bg-brand-charcoal overflow-hidden border relative group outline-none cursor-pointer",
                    currentImageIndex === idx
                      ? "border-brand-red bg-white/5 scale-[1.02] shadow"
                      : "border-outline-variant/10 opacity-70 hover:opacity-100 hover:border-white/30 transition-all",
                  )}
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    alt={`Perspective variant ${idx + 1}`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1.5 left-1.5 bg-black/85 text-[7px] font-technical-sm px-1 py-0.5 border border-white/5 font-bold">
                    0{idx + 1}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-5 flex flex-col gap-10">
          <header className="border-b border-brand-silver/10 pb-10">
            <div className="flex justify-between items-start mb-6">
              <span className="font-technical-sm text-[10px] text-on-surface-variant opacity-60 tracking-[0.2em]">
                DLNZ / SS26 / {product.sku}
              </span>
              {product.limited && (
                <span className="font-technical-sm text-[10px] text-brand-red font-bold">
                  LIMITED EDITION
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl uppercase leading-none mb-4">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="font-display text-3xl text-primary tracking-tighter">
                {formatPrice(product.price)}
              </div>
              <select
                value={currencyCode}
                onChange={(e) => {
                  setCurrency(e.target.value as any);
                }}
                className="flex items-center gap-1.5 px-2 py-1 font-technical-sm text-[8.5px] uppercase tracking-wider text-primary hover:text-brand-red border border-outline-variant/30 hover:border-brand-red/50 bg-[#0a0a0a] transition-all duration-300 focus:outline-none cursor-pointer select-none outline-none [color-scheme:dark]"
                title="Select Currency Protocol"
              >
                <option value="NGN">NGN ₦</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
              </select>
            </div>
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
                <button className="underline underline-offset-4 hover:text-primary transition-colors">
                  SIZE GUIDE
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {["S", "M", "L", "XL"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      "py-4 border font-technical-sm text-xs transition-all",
                      selectedSize === s
                        ? "border-primary bg-white text-black font-bold"
                        : "border-outline-variant/30 text-on-surface-variant hover:border-primary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-technical-sm tracking-widest opacity-60 uppercase">
                <span>FINISH</span>
                <span className="text-brand-red tracking-widest bg-white/5 border border-white/5 px-2.5 py-0.5 text-[8px] font-bold">
                  {product.colors && product.colors[selectedColorIndex]
                    ? product.colors[selectedColorIndex].toUpperCase()
                    : "DEFAULT"}
                </span>
              </div>
              <div className="flex gap-4">
                {product.colors?.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedColorIndex(i);
                      if (images.length > i) {
                        setCurrentImageIndex(i);
                      }
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full border cursor-pointer ring-offset-4 ring-offset-black transition-all flex items-center justify-center p-0 overflow-hidden relative",
                      selectedColorIndex === i
                        ? "border-brand-red ring-2 ring-brand-red scale-110"
                        : "border-outline-variant/30 hover:border-primary",
                    )}
                    title={c}
                  >
                    <span
                      className="w-full h-full block rounded-full scale-[0.8]"
                      style={{ backgroundColor: c }}
                    />
                  </button>
                )) || (
                  <div className="w-10 h-10 rounded-full border border-primary bg-black ring-2 ring-primary ring-offset-2 ring-offset-black" />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-10 border-t border-outline-variant/10">
            <button
              onClick={() => {
                const colorFin =
                  product.colors && product.colors[selectedColorIndex]
                    ? product.colors[selectedColorIndex]
                    : undefined;
                const selImg = images[currentImageIndex] || product.image;
                addToCart(product, selectedSize, 1, colorFin, selImg);
              }}
              className="w-full bg-white text-black font-technical-sm text-xs py-6 flex items-center justify-center gap-4 active:scale-95 transition-all hover:bg-neutral-200 tracking-[0.2em] font-bold cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              ADD TO RECIPIENT CART
            </button>
            <button
              onClick={handleWhatsAppCheckout}
              className="w-full bg-brand-red text-white font-technical-sm text-xs py-6 flex items-center justify-center gap-4 active:scale-95 transition-all hover:brightness-110 tracking-[0.2em] font-bold cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              BUY INSTANT ON WHATSAPP
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
          <h2 className="font-display text-3xl uppercase mb-16 tracking-tighter leading-none">
            Complete the Design
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="group space-y-6"
              >
                <div className="aspect-[3/4] bg-brand-charcoal overflow-hidden border border-outline-variant/10 relative">
                  <img
                    alt={item.name}
                    className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                    src={item.image}
                  />
                  <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 text-[8px] font-technical-sm tracking-widest">
                    DRIVEN LIFE / FW26 / 0{item.sku}
                  </div>
                </div>
                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1 block flex-grow">
                    <h4 className="font-technical-sm text-[10px] tracking-widest group-hover:text-brand-red transition-colors">
                      {item.name}
                    </h4>
                    <p className="font-technical-sm text-[10px] opacity-40">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <select
                    value={currencyCode}
                    onChange={(e) => {
                      setCurrency(e.target.value as any);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="text-[7.5px] font-technical-sm text-on-surface-variant hover:text-white border border-outline-variant/30 hover:border-brand-red/50 bg-[#0a0a0a] px-1.5 py-0.5 transition-all duration-300 focus:outline-none cursor-pointer select-none whitespace-nowrap outline-none [color-scheme:dark] ml-2"
                    title="Select Currency Protocol"
                  >
                    <option value="NGN">NGN ₦</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                  </select>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
