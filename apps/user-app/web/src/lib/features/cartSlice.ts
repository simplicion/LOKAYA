import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  storeId: string;
  storeName?: string;
  image?: string;
  variantName?: string;
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  isDrawerOpen: boolean;
  lastAddedItem: CartItem | null;
}

const initialState: CartState = {
  items: [],
  storeId: null,
  isDrawerOpen: false,
  lastAddedItem: null,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload;
      state.storeId = item.storeId;
      
      const existingItem = state.items.find(i => 
        (i.productId && item.productId && i.productId === item.productId) || 
        i.id === item.id ||
        i.id === item.productId ||
        i.productId === item.id
      );
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        state.items.push(item);
      }

      state.lastAddedItem = item;
      state.isDrawerOpen = false;
    },
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      if (action.payload.length === 0) {
        state.storeId = null;
        state.lastAddedItem = null;
      } else {
        state.storeId = action.payload[0].storeId || null;
      }
    },
    mergeCart: (state, action: PayloadAction<CartItem[]>) => {
      const merged = [...state.items];
      action.payload.forEach(incoming => {
        const idx = merged.findIndex(i => 
          (i.productId && incoming.productId && i.productId === incoming.productId) || 
          i.id === incoming.id ||
          i.id === incoming.productId ||
          i.productId === incoming.id
        );
        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            ...incoming,
            quantity: Math.max(merged[idx].quantity, incoming.quantity)
          };
        } else {
          merged.push(incoming);
        }
      });
      state.items = merged;
      if (merged.length > 0 && !state.storeId) {
        state.storeId = merged[0].storeId || null;
      }
    },
    openCartDrawer: (state, action: PayloadAction<CartItem | undefined>) => {
      if (action.payload) {
        state.lastAddedItem = action.payload;
      }
      state.isDrawerOpen = false;
    },
    closeCartDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const targetId = action.payload;
      state.items = state.items.filter(item => item.id !== targetId && item.productId !== targetId);
      if (state.items.length === 0) {
        state.storeId = null;
        state.lastAddedItem = null;
      } else if (state.lastAddedItem?.id === targetId || state.lastAddedItem?.productId === targetId) {
        state.lastAddedItem = state.items[state.items.length - 1] || null;
      }
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const targetId = action.payload.id;
      const item = state.items.find(i => i.id === targetId || i.productId === targetId);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(i => i.id !== targetId && i.productId !== targetId);
          if (state.items.length === 0) state.storeId = null;
          if (state.lastAddedItem?.id === targetId || state.lastAddedItem?.productId === targetId) {
            state.lastAddedItem = state.items[state.items.length - 1] || null;
          }
        } else {
          item.quantity = action.payload.quantity;
          if (state.lastAddedItem?.id === targetId || state.lastAddedItem?.productId === targetId) {
            state.lastAddedItem.quantity = action.payload.quantity;
          }
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.storeId = null;
      state.isDrawerOpen = false;
      state.lastAddedItem = null;
    }
  },
});

export const { 
  addToCart, 
  setCart,
  mergeCart,
  openCartDrawer, 
  closeCartDrawer, 
  removeFromCart, 
  updateQuantity, 
  clearCart 
} = cartSlice.actions;

export default cartSlice.reducer;

