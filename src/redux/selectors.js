import { createSelector } from '@reduxjs/toolkit';

// Select the products slice from the state
const selectProductsState = state => state.products;

// Memoized selector for products data
export const selectProducts = createSelector(
  [selectProductsState],
  (products) => ({
    items: products.items,
    status: products.status,
    error: products.error,
    hasMore: products.hasMore,
    page: products.page
  })
);

// Memoized selector for featured products
export const selectFeaturedProducts = createSelector(
  [selectProductsState],
  (products) => products.items.slice(0, 8) // Get first 8 products as featured
);
