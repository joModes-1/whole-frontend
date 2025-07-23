import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunk to fetch seller dashboard stats
export const fetchSellerDashboardStats = createAsyncThunk(
  'sellerDashboard/fetchStats',
  async (_, thunkAPI) => {
    try {
      // Optionally get token from auth if needed
      const state = thunkAPI.getState();
      const token = state.user?.data?.token;
      const response = await api.get('/dashboard/seller/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

const sellerDashboardSlice = createSlice({
  name: 'sellerDashboard',
  initialState: {
    stats: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearSellerDashboard(state) {
      state.stats = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerDashboardStats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSellerDashboardStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchSellerDashboardStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch dashboard stats';
      });
  },
});

export const { clearSellerDashboard } = sellerDashboardSlice.actions;
export default sellerDashboardSlice.reducer;
