/**
 * Product Service
 * 
 * Handles client-side API requests for the Product Domain.
 * Currently uses mock delays to simulate network requests until the 
 * backend API endpoints are available.
 */

// Types matching the frontend expectations
export interface ProductDraft {
  name: string;
  description: string;
  category: string;
  sku: string;
  sellingPrice: string;
  mrp: string;
  stockCount: string;
  isAvailableForDelivery: boolean;
  isAvailableForPickup: boolean;
}

export const ProductService = {
  /**
   * Fetches the seller's product list
   */
  async getProducts() {
    // TODO: Connect to GET /api/seller/products
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          // Mock data for now
        ]);
      }, 500);
    });
  },

  /**
   * Creates a new product from the seller workspace
   */
  async createProduct(data: ProductDraft) {
    // TODO: Connect to POST /api/seller/products
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!data.name || !data.sellingPrice) {
          reject(new Error('Missing required fields'));
        }
        resolve({
          success: true,
          productId: 'NEW-' + Math.random().toString(36).substr(2, 9),
          message: 'Product created successfully'
        });
      }, 1000);
    });
  },

  /**
   * Updates an existing product
   */
  async updateProduct(id: string, data: Partial<ProductDraft>) {
    // TODO: Connect to PUT /api/seller/products/:id
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          productId: id,
          message: 'Product updated successfully'
        });
      }, 1000);
    });
  }
};
