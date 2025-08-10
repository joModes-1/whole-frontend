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

// Commented out the store subscription that was causing infinite loops
// A better approach would be to handle persistence directly in the slice
// or use Redux Persist library for more robust state persistence
