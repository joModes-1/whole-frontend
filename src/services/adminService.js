import api from './api';

export const getUsers = async (page = 1, limit = 10, role = '', status = '', search = '') => {
  try {
    const response = await api.get('/admin/users', {
      params: { page, limit, role, status, search },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Failed to update user ${userId} status:`, error);
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
    console.error('Failed to fetch listings:', error);
    throw error;
  }
};

export const updateListingStatus = async (listingId, status) => {
  try {
    const response = await api.patch(`/admin/listings/${listingId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Failed to update listing ${listingId} status:`, error);
    throw error;
  }
};
