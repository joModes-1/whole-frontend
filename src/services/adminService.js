import api from './api';

export const getUsers = async (page = 1, limit = 10, role = '', status = '', search = '') => {
  try {
    const response = await api.get('/admin/users', {
      params: { page, limit, role, status, search },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: '/admin/users',
      params: { page, limit, role, status, search },
    });
    throw error;
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Failed to update user ${userId} status:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: `/admin/users/${userId}/status`,
      body: { status },
    });
    throw error;
  }
};

export const getListings = async (page = 1, limit = 10, status = '', search = '') => {
  try {
    const response = await api.get('/admin/listings', {
      params: { page, limit, status, search },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch listings:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: '/admin/listings',
      params: { page, limit, status, search },
    });
    throw error;
  }
};

export const updateListingStatus = async (listingId, status) => {
  try {
    const response = await api.patch(`/admin/listings/${listingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Failed to update listing ${listingId} status:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: `/admin/listings/${listingId}/status`,
      body: { status },
    });
    throw error;
  }
};
