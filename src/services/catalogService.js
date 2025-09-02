import api from './api';

// Categories
export const fetchCategories = async () => {
  const { data } = await api.get('/categories');
  return data; // [{ _id, name, subcategories: [...] }]
};

export const createCategory = async (payload) => {
  const { data } = await api.post('/categories', payload);
  return data;
};

export const updateCategory = async (id, payload) => {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

// Preset Images
export const fetchPresetImages = async (params = {}) => {
  const { data } = await api.get('/products/preset-images', { params });
  return data; // { images: [{ url, name }] } for public fetch; admin may need raw docs later
};

export const fetchPresetImagesAdmin = async (params = {}) => {
  const { data } = await api.get('/products/preset-images/admin', { params });
  return data; // { images: [{ _id, category, subcategory, url, name, tags, ... }] }
};

export const createPresetImage = async (payload) => {
  const { data } = await api.post('/products/preset-images', payload);
  return data;
};

export const updatePresetImage = async (id, payload) => {
  const { data } = await api.put(`/products/preset-images/${id}`, payload);
  return data;
};

export const deletePresetImage = async (id) => {
  const { data } = await api.delete(`/products/preset-images/${id}`);
  return data;
};

// Create preset image with file upload
export const createPresetImageWithFile = async (formData) => {
  const { data } = await api.post('/products/preset-images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};

// Update preset image with file upload
export const updatePresetImageWithFile = async (id, formData) => {
  const { data } = await api.put(`/products/preset-images/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
};
