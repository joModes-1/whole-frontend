import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (pageOrParams = 1, { getState, rejectWithValue }) => {
  console.log(`[Slice] fetchProducts thunk initiated with:`, pageOrParams);
  try {
    console.log('[Slice] Step 1: Getting state from Redux.');
    const currentState = getState().products;
    const { searchTerm, limit } = currentState;
    console.log(`[Slice] State retrieved: limit=${limit}, searchTerm='${searchTerm}'`);

    // Handle both page number and params object
    let page = 1;
    let overrideParams = {};
    
    if (typeof pageOrParams === 'object') {
      page = pageOrParams.page || 1;
      overrideParams = { ...pageOrParams };
      delete overrideParams.page; // Remove page from override params
    } else {
      page = pageOrParams || 1;
    }

    // Build safe params for API: do NOT forward internal UI filters like selectedCategories/availability/priceRange
    console.log('[Slice] Step 3: Constructing request parameters (sanitized).');
    const params = {
      page,
      limit,
      ...(searchTerm && { search: searchTerm }),
      ...overrideParams, // Only explicit URL params like { category, search }
    };
    console.log('[Slice] Parameters constructed:', params);

    const requestUrl = `${API_BASE_URL}/products`;
    console.log(`[Slice] Step 4: Preparing to send API request to ${requestUrl}`);
    
    // Timeout and abort support to avoid infinite loading (1m)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    let response;
    try {
      // Use AbortController for timeout; avoid axios timeout to prevent double-abort races
      response = await axios.get(requestUrl, { params, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    console.log('[Slice] Step 5: API request successful. Response received:', response.data);

    const { products: items, totalProducts } = response.data;

    if (!Array.isArray(items)) {
      console.error('[Slice] Response format error: `products` is not an array.');
      throw new Error('Expected `products` to be an array in the API response.');
    }

    const loadedCount = (page - 1) * limit + items.length;
    const hasMore = loadedCount < totalProducts;
    console.log(`[Slice] Step 6: Processed response. hasMore=${hasMore}, totalProducts=${totalProducts}`);

    return {
      items,
      page,
      hasMore,
      totalProducts
    };
  } catch (error) {
    console.error('--- [Slice] CRITICAL ERROR in fetchProducts thunk ---');
    // Normalize timeout / abort
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED') {
      console.error('Request aborted due to timeout.');
      return rejectWithValue('Request timed out. Please try again.');
    }
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error Request:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('Full Error Object:', error);
    console.error('--- End of CRITICAL ERROR ---');
    return rejectWithValue(error.message || 'A critical error occurred');
  }
});

const productsAdapter = createEntityAdapter({
  selectId: (product) => product._id,
});

// Load products from localStorage if available
const getInitialProductsState = () => {
  let initialState = productsAdapter.getInitialState({
    status: 'idle',
    error: null,
    page: 1,
    hasMore: true,
    searchTerm: '',
    filters: {},
    limit: 20,
    hasFetched: false,
    initialized: false,
    allProducts: [], // Ensure allProducts is always an array
    currentRequestId: null,
  });

  try {
    const stored = localStorage.getItem('products');
    if (stored) {
      const parsed = JSON.parse(stored);
      const products = parsed.ids && parsed.entities ? parsed.ids.map(id => parsed.entities[id]) : [];
      initialState = productsAdapter.setAll(initialState, products);
      // Create a new object to avoid modifying read-only properties
      initialState = {
        ...initialState,
        status: parsed.status || 'idle',
        error: parsed.error || null,
        page: parsed.page || 1,
        hasMore: parsed.hasMore !== undefined ? parsed.hasMore : true,
        searchTerm: parsed.searchTerm || '',
        filters: parsed.filters || {},
        limit: parsed.limit || 20,
        hasFetched: typeof parsed.hasFetched === 'boolean' ? parsed.hasFetched : false,
        initialized: parsed.initialized || false,
        allProducts: products
      };
    }
  } catch (e) {
    console.error('Error reading products from localStorage:', e);
  }

  return initialState;
};

const productsSlice = createSlice({
  name: 'products',
  initialState: getInitialProductsState(),
  reducers: {
    resetProducts: (state) => {
      productsAdapter.removeAll(state);
      state.page = 1;
      state.hasMore = true;
      state.status = 'idle';
      state.error = null;
      state.hasFetched = false;
      state.initialized = false;
      state.currentRequestId = null;
    },
    hydrateProducts: (state, action) => {
      // action.payload should be an array of products
      if (Array.isArray(action.payload) && action.payload.length > 0) {
        productsAdapter.setAll(state, action.payload);
        state.status = 'succeeded';
        state.hasFetched = true;
        state.initialized = true;
        state.error = null;
      }
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setLoadingMore: (state) => {
      state.status = 'loadingMore';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        state.currentRequestId = action.meta.requestId;
        const arg = action.meta.arg;
        const isInitialLoad = (typeof arg === 'number' && arg === 1) || (typeof arg === 'object' && (arg?.page || 1) === 1);
        const hasExistingProducts = state.ids.length > 0;
        console.log('Pending fetchProducts with arg:', arg, 'isInitialLoad:', isInitialLoad, 'hasExistingProducts:', hasExistingProducts);
        
        // Only show loading skeleton if this is truly an initial load with no existing products
        // For category switches, keep existing products visible until new ones load
        if (isInitialLoad && !hasExistingProducts) {
          state.status = 'loading';
          productsAdapter.removeAll(state);
        } else if (!isInitialLoad) {
          state.status = 'loadingMore';
        } else {
          // Category switch with existing products - keep current status to avoid skeleton
          state.status = 'succeeded';
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        // Ignore out-of-order responses (e.g., user types quickly and older request finishes later)
        if (state.currentRequestId && state.currentRequestId !== action.meta.requestId) {
          console.log('[Slice] Ignoring stale fetchProducts response:', action.meta.requestId);
          return;
        }
        const { items, page, hasMore } = action.payload;
        state.status = 'succeeded';
        state.page = page;
        state.hasMore = hasMore;
        state.hasFetched = true;
        state.initialized = true;
        state.currentRequestId = null;
        if (page === 1) {
          productsAdapter.setAll(state, items);
        } else {
          productsAdapter.upsertMany(state, items);
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (state.currentRequestId && state.currentRequestId !== action.meta.requestId) {
          console.log('[Slice] Ignoring stale fetchProducts error:', action.meta.requestId);
          return;
        }
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Failed to fetch products';
        state.currentRequestId = null;
      });
  },
});

export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
} = productsAdapter.getSelectors((state) => state.products);

export const { resetProducts, setSearchTerm, setFilters, hydrateProducts, setLoadingMore } = productsSlice.actions;
export default productsSlice.reducer;
