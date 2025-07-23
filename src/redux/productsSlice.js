import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (page = 1, { getState, rejectWithValue }) => {
  try {
    // Artificial delay for skeleton testing
    await new Promise(resolve => setTimeout(resolve, 800));
    const { products } = getState();
    const { searchTerm, filters } = products;
    
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== '')
    );
    const params = {
      page,
      limit: 20,
      ...(searchTerm && { search: searchTerm }),
      ...cleanedFilters,
    };
    console.log('Params being sent:', params);
    
    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    
    // Handle different API response structures
    const items = Array.isArray(response.data)
      ? response.data
      : response.data?.data
        || response.data?.products
        || response.data?.items
        || [];
    console.log('Fetched items:', items, 'Raw response:', response.data);
    // If we don't get a full page, we've reached the end
    const hasMore = items.length === 20;
    return {
      items,
      page,
      hasMore
    };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

const productsAdapter = createEntityAdapter({
  selectId: (product) => product._id,
});

// Load products from localStorage if available
const getInitialProductsState = () => {
  try {
    const stored = localStorage.getItem('products');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Use productsAdapter to set items
      return productsAdapter.setAll(
        productsAdapter.getInitialState({
          status: parsed.status || 'idle',
          error: parsed.error || null,
          page: parsed.page || 1,
          hasMore: parsed.hasMore !== undefined ? parsed.hasMore : true,
          searchTerm: parsed.searchTerm || '',
          filters: parsed.filters || {},
          hasFetched: typeof parsed.hasFetched === 'boolean' ? parsed.hasFetched : false,
          initialized: parsed.initialized || false,
        }),
        parsed.ids && parsed.entities ? parsed.ids.map(id => parsed.entities[id]) : []
      );
    }
  } catch (e) {
    console.error('Error reading products from localStorage:', e);
  }
  return productsAdapter.getInitialState({
    status: 'idle',
    error: null,
    page: 1,
    hasMore: true,
    searchTerm: '',
    filters: {},
    hasFetched: false,
    initialized: false,
  });
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        console.log('Pending fetchProducts with page:', action.meta.arg); // Debug log
        const isInitialLoad = action.meta.arg === 1;
        state.status = isInitialLoad ? 'loading' : 'loadingMore';
        if (isInitialLoad) {
          productsAdapter.removeAll(state);
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const { items, page, hasMore } = action.payload;
        state.status = 'succeeded';
        state.page = page;
        state.hasMore = hasMore;
        state.hasFetched = true;
        state.initialized = true;
        if (page === 1) {
          productsAdapter.setAll(state, items);
        } else {
          productsAdapter.upsertMany(state, items);
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Failed to fetch products';
      });
  },
});

export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
} = productsAdapter.getSelectors((state) => state.products);

export const { resetProducts, setSearchTerm, setFilters, hydrateProducts } = productsSlice.actions;
export default productsSlice.reducer;
