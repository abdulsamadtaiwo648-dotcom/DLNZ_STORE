import React, { useState, useEffect } from 'react';
import { X, Save, Box, Tag, DollarSign, Layers, Image as ImageIcon, Upload, Link as LinkIcon, Loader } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { cn } from '../../lib/utils';

interface ProductModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 650;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
    };
    reader.onerror = () => resolve('');
  });
};

export const ProductModal = ({ product, isOpen, onClose, onSuccess }: ProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    category: '',
    subcategory: '',
    image: '',
    hoverImage: '',
    stock: 0,
    sku: '',
    description: '',
    material: '',
    colors: [],
    details: []
  });

  const [imageTab, setImageTab] = useState<'primary' | 'hover'>('primary');
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    if (product) {
      const { id, ...rest } = product;
      setFormData(rest);
    } else {
      setFormData({
        name: '',
        price: 0,
        category: 'Apparel',
        subcategory: '',
        image: '',
        hoverImage: '',
        stock: 0,
        sku: `SKU-${Math.floor(Math.random() * 10000)}`,
        description: '',
        material: '',
        colors: [],
        details: []
      });
    }
  }, [product, isOpen]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isHover = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(isHover ? 'hovering' : 'primary');
    try {
      // 1. Try Firebase Storage upload
      const path = `products/${formData.sku || 'temp'}_${isHover ? 'hover' : 'main'}_${file.name}`;
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({
        ...prev,
        [isHover ? 'hoverImage' : 'image']: downloadURL
      }));
    } catch (err) {
      console.warn('Firebase Storage upload failed, falling back to base64 compression:', err);
      // 2. Fallback to optimized Base64
      const base64 = await compressImage(file);
      if (base64) {
        setFormData(prev => ({
          ...prev,
          [isHover ? 'hoverImage' : 'image']: base64
        }));
      }
    } finally {
      setUploadProgress('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Please set a primary product image before committing.');
      return;
    }
    setLoading(true);
    try {
      if (product?.id) {
        await productService.updateProduct(product.id, formData);
      } else {
        await productService.createProduct(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-surface border border-outline-variant/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/20 sticky top-0 bg-surface z-10">
          <div>
            <span className="font-technical-sm text-[8px] text-brand-red uppercase tracking-[0.3em] block mb-1">Sector: Inventory / Action: {product ? 'Update' : 'Register'}</span>
            <h2 className="font-display text-2xl uppercase tracking-tighter">{product ? 'Modify SKU' : 'New Entry'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest flex items-center gap-2">
                <Box className="w-3 h-3" /> Product Name
              </label>
              <input
                required
                className="w-full bg-surface-container border border-outline-variant/30 p-4 font-body text-sm uppercase focus:border-brand-red outline-none transition-colors"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest flex items-center gap-2">
                  <Tag className="w-3 h-3" /> SKU ID
                </label>
                <input
                  required
                  className="w-full bg-surface-container border border-outline-variant/30 p-4 font-technical-sm text-xs focus:border-brand-red outline-none transition-colors"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Price (NGN)
                </label>
                <input
                  required
                  type="number"
                  className="w-full bg-surface-container border border-outline-variant/30 p-4 font-technical-sm text-xs focus:border-brand-red outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Category
                </label>
                <select
                  required
                  className="w-full bg-surface-container border border-outline-variant/30 p-4 font-technical-sm text-[10px] uppercase focus:border-brand-red outline-none transition-colors"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Apparel">Apparel</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest">Inventory Count</label>
                <input
                  required
                  type="number"
                  className="w-full bg-surface-container border border-outline-variant/30 p-4 font-technical-sm text-xs focus:border-brand-red outline-none transition-colors"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-technical-sm text-[10px] uppercase opacity-40 tracking-widest">Description</label>
              <textarea
                className="w-full bg-surface-container border border-outline-variant/30 p-4 font-body text-sm min-h-[120px] focus:border-brand-red outline-none transition-colors"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Image Section Header */}
            <div>
              <span className="font-technical-sm text-[9px] uppercase tracking-widest opacity-60">Visual Assets</span>
              <div className="flex border border-outline-variant/30 mt-2 font-technical-sm text-[9px] uppercase tracking-widest">
                <button
                  type="button"
                  onClick={() => setImageTab('primary')}
                  className={cn(
                    "flex-1 p-3 text-center border-r border-outline-variant/30 transition-all font-bold cursor-pointer",
                    imageTab === 'primary' ? "bg-primary text-on-primary" : "text-primary/60 hover:bg-surface-variant/20"
                  )}
                >
                  Primary Main
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('hover')}
                  className={cn(
                    "flex-1 p-3 text-center transition-all font-bold cursor-pointer",
                    imageTab === 'hover' ? "bg-primary text-on-primary" : "text-primary/60 hover:bg-surface-variant/20"
                  )}
                >
                  Hover Reveal
                </button>
              </div>
            </div>

            {/* Input Selection Block - URL or Direct Upload */}
            <div className="border border-outline-variant/20 p-5 bg-surface-container-lowest space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                <span className="font-technical-sm text-[8px] uppercase tracking-widest opacity-55">
                  Method: {uploadMode === 'file' ? 'Direct Upload' : 'External Link'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={cn(
                      "p-1.5 border transition-all text-[8px] font-technical-sm tracking-wider uppercase px-2 font-bold cursor-pointer",
                      uploadMode === 'file' ? "border-brand-red text-brand-red" : "border-outline-variant/30 text-primary/40 hover:text-primary"
                    )}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={cn(
                      "p-1.5 border transition-all text-[8px] font-technical-sm tracking-wider uppercase px-2 font-bold cursor-pointer",
                      uploadMode === 'link' ? "border-brand-red text-brand-red" : "border-outline-variant/30 text-primary/40 hover:text-primary"
                    )}
                  >
                    Paste Link
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div className="relative border border-dashed border-outline-variant/40 hover:border-brand-red/50 transition-colors bg-surface-container/60 group p-6 text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, imageTab === 'hover')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {uploadProgress === (imageTab === 'hover' ? 'hovering' : 'primary') ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader className="w-5 h-5 animate-spin text-brand-red" />
                      <span className="font-technical-sm text-[9px] uppercase tracking-widest text-brand-red animate-pulse">Uploading Media...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Upload className="w-6 h-6 text-primary/40 group-hover:text-brand-red transition-colors" />
                      <span className="font-technical-sm text-[9px] uppercase tracking-widest font-bold">Deploy File Segment</span>
                      <span className="font-technical-sm text-[8px] opacity-40 uppercase">Drag & Drop or Tap here</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-technical-sm text-[9px] uppercase opacity-40 tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" /> External Reference URL
                  </label>
                  <input
                    className="w-full bg-surface-container border border-outline-variant/30 p-3 font-technical-sm text-[10px] focus:border-brand-red outline-none transition-colors"
                    value={imageTab === 'hover' ? formData.hoverImage : formData.image}
                    placeholder="https://images.unsplash.com/..."
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      [imageTab === 'hover' ? 'hoverImage' : 'image']: e.target.value
                    }))}
                  />
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div>
              <span className="font-technical-sm text-[9px] uppercase tracking-widest opacity-60 block mb-2 font-bold">Live Graphic Linkage</span>
              <div className="aspect-[3/4] border border-outline-variant/20 bg-surface-container-high overflow-hidden relative">
                {(imageTab === 'hover' ? formData.hoverImage : formData.image) ? (
                  <img
                    src={imageTab === 'hover' ? formData.hoverImage : formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover grayscale transition-transform hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center opacity-30">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="font-technical-sm text-[8px] uppercase tracking-widest">No Graphic Link Registered</span>
                  </div>
                )}
                {imageTab === 'hover' && (
                  <div className="absolute top-2 left-2 bg-brand-red text-white font-technical-sm text-[7px] uppercase tracking-widest px-1.5 py-0.5">
                    Hover Preview
                  </div>
                )}
              </div>
            </div>

            {/* Commit action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !!uploadProgress}
                className="w-full bg-primary text-on-primary py-5 font-technical-sm text-[10px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-4 hover:bg-brand-red transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : (
                  <>
                    <Save className="w-4 h-4" />
                    Commit Subroutine
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
