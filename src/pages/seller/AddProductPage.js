import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AddProductPage.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AddProductPage = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    specifications: '', // Simple text area for now
    features: '',       // Simple text area for now
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
        setImages(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const specObject = productData.specifications
        .split('\n')
        .reduce((acc, line) => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            if (value) {
                acc[key.trim()] = value;
            }
          }
          return acc;
        }, {});

      const featuresArray = productData.features
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('name', productData.name.trim());
      formData.append('description', productData.description.trim());
      formData.append('price', Number(productData.price));
      formData.append('category', productData.category.trim());
      formData.append('stock', Number(productData.stock) || 0);
      formData.append('specifications', JSON.stringify(specObject));
      formData.append('features', JSON.stringify(featuresArray));

      // Add images as 'images' field
      images.forEach((image, index) => {
        formData.append('images', image, image.name);
      });

      try {
        const response = await axios.post(`${API_BASE_URL}/products`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 201) {
          setSuccess('Product added successfully! Redirecting...');
          setProductData({ name: '', description: '', price: '', category: '', stock: '', specifications: '', features: '' });
          setImages([]);
          // Dispatch product list refresh so new product appears at top
          if (window && window.store) {
            window.store.dispatch(require('../../redux/productsSlice').resetProducts());
            window.store.dispatch(require('../../redux/productsSlice').fetchProducts(1));
          }
          setTimeout(() => {
            navigate('/products?refresh=1');
          }, 2000);
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error creating product:', error);
        if (error.response) {
          setError(error.response.data.message || `Server Error: ${error.response.status}`);
        } else {
          setError('An unexpected error occurred while creating the product.');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Detailed error adding product:', err);
      if (err.response) {
        console.error('Error Response Data:', err.response.data);
        setError(err.response.data.message || `Server Error: ${err.response.status}`);
      } else if (err.request) {
        console.error('Error Request:', err.request);
        setError('Network Error: No response from server. Please ensure the backend is running.');
      } else {
        console.error('Error Message:', err.message);
        setError('An unexpected error occurred while sending the request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <h2>Add New Product</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name</label>
          <input type="text" name="name" id="name" value={productData.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea name="description" id="description" value={productData.description} onChange={handleChange} required rows="4"></textarea>
        </div>

        <div className="form-group">
            <label htmlFor="price">Price (USD)</label>
            <input type="number" name="price" id="price" value={productData.price} onChange={handleChange} required min="0" step="0.01" />
        </div>
        <div className="form-group">
            <label htmlFor="stock">Stock Quantity</label>
            <input type="number" name="stock" id="stock" value={productData.stock} onChange={handleChange} required min="0" step="1" />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input type="text" name="category" id="category" value={productData.category} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="specifications">Specifications</label>
          <textarea name="specifications" id="specifications" value={productData.specifications} onChange={handleChange} rows="3" placeholder="e.g., Color: Red\nSize: Large"></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="features">Features (one per line)</label>
          <textarea name="features" id="features" value={productData.features} onChange={handleChange} rows="3" placeholder="e.g., Durable\nLightweight"></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="images">Product Images</label>
          <input type="file" name="images" id="images" onChange={handleImageChange} multiple accept="image/*" />
        </div>
        
        {images.length > 0 && (
            <div className="image-preview-container">
                {images.map((image, index) => (
                    <div key={index} className="image-preview">
                        <img src={URL.createObjectURL(image)} alt={`preview ${index}`} />
                        <button type="button" onClick={() => removeImage(index)} className="remove-image-btn">X</button>
                    </div>
                ))}
            </div>
        )}

        <button type="submit" disabled={loading} className="add-product-button">
            {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProductPage;
