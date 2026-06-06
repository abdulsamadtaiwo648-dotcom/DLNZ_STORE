import { productService } from './productService';
import { Product } from '../types';

export const inventoryService = {
  /**
   * Active retrieval of the full catalog with current stock quantities.
   */
  async getInventory(): Promise<Product[]> {
    return productService.getAllProducts();
  },

  /**
   * Real-time stream subscription of inventory state changes.
   */
  subscribeToInventory(onUpdate: (products: Product[]) => void, onError?: (error: unknown) => void): () => void {
    return productService.subscribeToProducts(onUpdate, onError);
  },

  /**
   * Overwrite the absolute stock quantity for a given product ID.
   */
  async updateStock(productId: string, newStock: number): Promise<void> {
    if (newStock < 0) {
      throw new Error('Stock volume cannot be negative.');
    }
    await productService.updateProduct(productId, { stock: newStock });
  },

  /**
   * Adjust product stock levels in relative volume (e.g., -1 on checkout, or +N on restock).
   */
  async adjustStock(productId: string, amount: number): Promise<void> {
    const product = await productService.getProductById(productId);
    if (!product) {
      throw new Error(`Product matching ID ${productId} does not exist.`);
    }
    const finalStock = (product.stock || 0) + amount;
    if (finalStock < 0) {
      throw new Error(`Insufficient inventory on hand for ${product.name}. Current stock: ${product.stock}`);
    }
    await this.updateStock(productId, finalStock);
  },

  /**
   * Quick utility check to see if a product has the required stock quantity.
   */
  async checkAvailability(productId: string, desiredQty = 1): Promise<boolean> {
    const product = await productService.getProductById(productId);
    if (!product) return false;
    return (product.stock || 0) >= desiredQty;
  }
};
