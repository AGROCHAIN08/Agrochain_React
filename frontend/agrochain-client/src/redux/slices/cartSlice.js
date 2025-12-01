// src/redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const getInitialCart = (userRole) => {
  const cartKey = `${userRole}Cart`;
  const savedCart = localStorage.getItem(cartKey);
  return savedCart ? JSON.parse(savedCart) : [];
};

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    initializeCart: (state, action) => {
      const userRole = action.payload;
      state.items = getInitialCart(userRole);
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.quantity * (item.targetPrice || item.unitPrice || 0)), 0);
    },
    addToCart: (state, action) => {
      const { item, userRole } = action.payload;
      const existingItem = state.items.find(i => i._id === item._id);
      
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        state.items.push(item);
      }
      
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.quantity * (item.targetPrice || item.unitPrice || 0)), 0);
      
      localStorage.setItem(`${userRole}Cart`, JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      const { itemId, userRole } = action.payload;
      state.items = state.items.filter(item => item._id !== itemId);
      
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.quantity * (item.targetPrice || item.unitPrice || 0)), 0);
      
      localStorage.setItem(`${userRole}Cart`, JSON.stringify(state.items));
    },
    updateCartQuantity: (state, action) => {
      const { itemId, quantity, userRole } = action.payload;
      const item = state.items.find(i => i._id === itemId);
      
      if (item) {
        item.quantity = quantity;
      }
      
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.quantity * (item.targetPrice || item.unitPrice || 0)), 0);
      
      localStorage.setItem(`${userRole}Cart`, JSON.stringify(state.items));
    },
    clearCart: (state, action) => {
      const userRole = action.payload;
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      localStorage.removeItem(`${userRole}Cart`);
    },
  },
});

export const { initializeCart, addToCart, removeFromCart, updateCartQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;