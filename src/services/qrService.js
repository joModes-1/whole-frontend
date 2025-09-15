import api from './api';

/**
 * Generate QR code for an existing order
 * @param {string} orderId - The order ID
 * @returns {Promise} - API response with QR code data
 */
export const generateQRCode = async (orderId) => {
  try {
    const response = await api.post(`/qr/generate/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Generate QR code error:', error);
    throw error;
  }
};
