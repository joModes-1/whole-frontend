/**
 * Feature flags and configuration for the application
 * 
 * This file contains feature flags that can be toggled to enable/disable
 * certain features or change application behavior.
 * 
 * To enable/disable a feature, simply change its value to true/false.
 */

export const features = {
  /**
   * When enabled, products will be prefetched as soon as the app loads.
   * When disabled, products will only be fetched when the user navigates to the products page.
   * 
   * Set to `false` by default to avoid unnecessary API calls.
   * Set to `true` to enable eager loading of products.
   */
  EAGER_LOAD_PRODUCTS: false,

  /**
   * Configuration for products API
   */
  products: {
    // Number of products to load initially
    initialLimit: 20,
    
    // Default sort order
    sortField: 'createdAt',
    sortOrder: 'desc',
    
    // Cache settings (in milliseconds)
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
};

// Helper to check if a feature is enabled
export const isFeatureEnabled = (feature) => {
  return features[feature] === true;
};

// Export default for backward compatibility
export default features;
