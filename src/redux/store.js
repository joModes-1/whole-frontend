import { configureStore } from '@reduxjs/toolkit';

import productsReducer from './productsSlice';
import categoryReducer from './categorySlice';
import userReducer from './userSlice';
import sellerDashboardReducer from './sellerDashboardSlice';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  products: productsReducer,
  categories: categoryReducer,
  user: userReducer,
  sellerDashboard: sellerDashboardReducer,
  // cart: cartReducer, // Uncomment and add if you have a cart slice
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/STOP',
          'persist/PURGE',
          'persist/REHYDRATE'
        ]
      }
    })
});

// Persist products state to localStorage on change
store.subscribe(() => {
  const state = store.getState();
  try {
    const productsState = state.products;
    // Only persist if products have been fetched and there are products
    if (productsState.hasFetched && Array.isArray(productsState.ids) && productsState.ids.length > 0) {
      localStorage.setItem('products', JSON.stringify(productsState));
    }
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
});
