import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './EditProductPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const EditProductPage = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    specifications: '',
    features: '',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { token } = useAuth();
  const { id } = useParams();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/products/${id}`);
        const { name, description, price, category, stock, specifications, features, images } = response.data;
        setProductData({
          name,
          description,
          price,
          category,
          stock,
          specifications: specifications ? Object.entries(specifications).map(([key, value]) => `${key}: ${value}`).join('\n') : '',
          features: features ? features.join('\n') : '',
        });
        setExistingImages(images || []);
      } catch (err) {
        setError('Failed to fetch product data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeNewImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeExistingImage = (imageToRemove) => {
    setExistingImages(prev => prev.filter(image => image.url !== imageToRemove.url));
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
            acc[key.trim()] = valueParts.join(':').trim();
          }
          return acc;
        }, {});

      const featuresArray = productData.features.split('\n').map(f => f.trim()).filter(Boolean);

      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('description', productData.description);
      formData.append('price', productData.price);
      formData.append('category', productData.category);
      formData.append('stock', productData.stock);
      formData.append('specifications', JSON.stringify(specObject));
      formData.append('features', JSON.stringify(featuresArray));
      formData.append('existingImages', JSON.stringify(existingImages));

      images.forEach(image => {
        formData.append('images', image);
      });

            await axios.put(`${API_BASE_URL}/products/seller/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Product updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/seller/products');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-product-container">
      <h2>Edit Product</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="edit-product-form">
        {/* Form fields are similar to AddProductPage, pre-filled with productData */}
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
          <label>Existing Images</label>
          <div className="image-preview-container">
            {existingImages.map((image, index) => (
              <div key={index} className="image-preview">
                <img src={image.url} alt={`existing ${index}`} />
                <button type="button" onClick={() => removeExistingImage(image)} className="remove-image-btn">X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="images">Add New Images</label>
          <input type="file" name="images" id="images" onChange={handleImageChange} multiple accept="image/*" />
        </div>
        
        {images.length > 0 && (
            <div className="image-preview-container">
                {images.map((image, index) => (
                    <div key={index} className="image-preview">
                        <img src={URL.createObjectURL(image)} alt={`preview ${index}`} />
                        <button type="button" onClick={() => removeNewImage(index)} className="remove-image-btn">X</button>
                    </div>
                ))}
            </div>
        )}

        <button type="submit" disabled={loading} className="update-product-button">
            {loading ? 'Updating Product...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default EditProductPage;
