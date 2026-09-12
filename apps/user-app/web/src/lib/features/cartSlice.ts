import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
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
      
      const existingItem = state.items.find(i => i.id === item.id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        state.items.push(item);
      }

      state.lastAddedItem = item;
      state.isDrawerOpen = true;
    },
    openCartDrawer: (state, action: PayloadAction<CartItem | undefined>) => {
      if (action.payload) {
        state.lastAddedItem = action.payload;
      }
      state.isDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      if (state.items.length === 0) {
        state.storeId = null;
        state.lastAddedItem = null;
      } else if (state.lastAddedItem?.id === action.payload) {
        state.lastAddedItem = state.items[state.items.length - 1] || null;
      }
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(i => i.id !== action.payload.id);
          if (state.items.length === 0) state.storeId = null;
          if (state.lastAddedItem?.id === action.payload.id) {
            state.lastAddedItem = state.items[state.items.length - 1] || null;
          }
        } else {
          item.quantity = action.payload.quantity;
          if (state.lastAddedItem?.id === action.payload.id) {
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
  openCartDrawer, 
  closeCartDrawer, 
  removeFromCart, 
  updateQuantity, 
  clearCart 
} = cartSlice.actions;

export default cartSlice.reducer;

