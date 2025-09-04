import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CategoryDropdown from '../../components/CategoryDropdown';
import ProductTypeDropdown from '../../components/ProductTypeDropdown';
import ConditionDropdown from '../../components/ConditionDropdown';
import DescriptionHelper from '../../components/DescriptionHelper';
import PresetImageSelector from '../../components/PresetImageSelector';
import './AddProductPage.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AddProductPage = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    productType: '',
    condition: '',
    stock: '',
    specifications: '',
    features: '',
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedPresetImages, setSelectedPresetImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { token } = useAuth();
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
    
    // Auto-detect category based on product name
    if (name === 'name') {
      const detectedCategory = detectCategory(value);
      if (detectedCategory && !userSelectedCategory) {
        setProductData(prev => ({ ...prev, category: detectedCategory }));
      }
    }
  };

  const handleProductTypeChange = (productType) => {
    setProductData(prev => ({ ...prev, productType }));
  };

  const handleConditionChange = (condition) => {
    setProductData(prev => ({ ...prev, condition }));
  };
  
  // Function to automatically detect category based on product name
  const detectCategory = (productName) => {
    if (!productName) return null;
    
    const lowerName = productName.toLowerCase();
    
    // Electronics keywords
    const electronicsKeywords = [
      'phone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker', 'camera', 'tv', 'monitor', 
      'keyboard', 'mouse', 'charger', 'cable', 'battery', 'smartwatch', 'drone', 'printer', 'router', 
      'modem', 'smartphone', 'desktop', 'notebook', 'wireless', 'bluetooth', 'usb', 'hdmi', 'ssd', 
      'hdd', 'processor', 'motherboard', 'graphics', 'gpu', 'ram', 'memory', 'adapter', 'converter',
      'amplifier', 'microphone', 'webcam', 'earbuds', 'earphones'
    ];
    if (electronicsKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Electronics';
    }
    
    // Clothing keywords
    const clothingKeywords = [
      'shirt', 'pants', 'jeans', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'socks', 'shoes', 
      'boots', 'sneakers', 'hat', 'cap', 'gloves', 'scarf', 'belt', 'underwear', 'bra', 'blouse', 
      'suit', 'uniform', 't-shirt', 'hoodie', 'sweatshirt', 'shorts', 'trousers', 'vest', 'cardigan',
      'sandal', 'slippers', 'heels', 'sneaker', 'jean', 'pant', 'sleeve', 'collar', 'button'
    ];
    if (clothingKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Clothing';
    }
    
    // Home & Garden keywords
    const homeGardenKeywords = [
      'furniture', 'chair', 'table', 'sofa', 'bed', 'lamp', 'light', 'tool', 'garden', 'plant', 
      'pot', 'decor', 'kitchen', 'bathroom', 'window', 'door', 'paint', 'hammer', 'screwdriver', 
      'wrench', 'drill', 'saw', 'ladder', 'hose', 'pipe', 'tile', 'carpet', 'curtain', 'blinds',
      'cabinet', 'drawer', 'shelf', 'desk', 'wardrobe', 'mattress', 'pillow', 'blanket', 'sheet'
    ];
    if (homeGardenKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Home & Garden';
    }
    
    // Sports keywords
    const sportsKeywords = [
      'ball', 'bike', 'bicycle', 'football', 'basketball', 'tennis', 'golf', 'swimming', 'yoga', 
      'fitness', 'workout', 'running', 'ski', 'skateboard', 'dumbbell', 'treadmill', 'helmet', 
      'gloves', 'racket', 'net', 'bat', 'club', 'paddle', 'skates', 'scooter', 'exercise', 'training',
      'workout', 'gym', 'athletic', 'sport'
    ];
    if (sportsKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Sports';
    }
    
    // Books keywords
    const booksKeywords = [
      'book', 'novel', 'textbook', 'manual', 'guide', 'magazine', 'journal', 'encyclopedia', 
      'dictionary', 'atlas', 'comic', 'biography', 'cookbook', 'handbook', 'ebook', 'audiobook',
      'paperback', 'hardcover', 'edition', 'volume', 'chapter'
    ];
    if (booksKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Books';
    }
    
    return null;
  };

  const handleCategoryChange = useCallback((category) => {
    // Extract category name if category is an object
    const categoryName = typeof category === 'object' ? category.name : category;
    setProductData(prev => ({ ...prev, category: categoryName }));
    setUserSelectedCategory(true);
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      
      // Create previews for the new images
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => {
      // Revoke the URL to free memory
      if (prev[indexToRemove]) {
        URL.revokeObjectURL(prev[indexToRemove]);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handlePresetImageSelect = (selectedImages) => {
    setSelectedPresetImages(selectedImages);
  };

  const resetForm = () => {
    setProductData({
      name: '',
      description: '',
      price: '',
      category: '',
      productType: '',
      condition: '',
      stock: '',
      specifications: '',
      features: '',
    });
    setImages([]);
    setImagePreviews([]);
    setSelectedPresetImages([]);
    setUserSelectedCategory(false);
    setError('');
    setSuccess('');
    setCurrentStep(1);
  };

  const validateForm = () => {
    const errors = [];
    
    // Step 1 validations
    if (!productData.category) {
      errors.push('Please select a category');
    }
    if (!productData.productType) {
      errors.push('Please select a subcategory/product type');
    }
    if (!productData.condition) {
      errors.push('Please select a condition');
    }

    // Step 2 validations
    if (!productData.name.trim()) {
      errors.push('Product name is required');
    }
    
    if (!productData.description.trim()) {
      errors.push('Product description is required');
    }
    
    if (productData.price <= 0) {
      errors.push('Price must be greater than zero');
    }
    
    if (productData.stock < 0) {
      errors.push('Stock quantity cannot be negative');
    }
    
    return errors;
  };

  const canProceedStep1 = () => {
    return Boolean(productData.category && productData.productType && productData.condition);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Process specifications
      const specObject = productData.specifications
        .split('\n')
        .reduce((acc, line) => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            acc[key.trim()] = value;
          }
          return acc;
        }, {});

      const featuresArray = productData.features.split('\n').map(f => f.trim()).filter(Boolean);

      // Create form data
      const formData = new FormData();
      formData.append('name', productData.name.trim());
      formData.append('description', productData.description.trim());
      formData.append('price', productData.price);
      formData.append('category', productData.category);
      formData.append('productType', productData.productType);
      formData.append('condition', productData.condition);
      formData.append('stock', productData.stock);
      formData.append('specifications', JSON.stringify(specObject));
      formData.append('features', JSON.stringify(featuresArray));

      images.forEach(image => {
        formData.append('images', image);
      });

      // Append preset images as URLs
      if (selectedPresetImages.length > 0) {
        selectedPresetImages.forEach(image => {
          formData.append('presetImages', image.url);
        });
      }

      // Submit product
      await axios.post(`${API_BASE_URL}/products`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Product added successfully! Redirecting...');
      
      // Reset form
      setProductData({
        name: '',
        description: '',
        price: '',
        category: '',
        productType: '',
        condition: '',
        stock: '',
        specifications: '',
        features: ''
      });
      setImages([]);
      setImagePreviews([]);
      setUserSelectedCategory(false);
      
      navigate('/seller/products');

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
      
      {/* Stepper */}
      <div className="stepper">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>1. Category & Condition</div>
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>2. Details & Images</div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* STEP 1: Category, Subcategory, Condition */}
      {currentStep === 1 && (
        <div className="add-product-form">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <CategoryDropdown 
              value={productData.category} 
              onChange={handleCategoryChange} 
              required 
            />
            <p className="helper-text">Select the most appropriate category for your product</p>
          </div>

          <div className="form-group">
            <label htmlFor="productType">Subcategory / Product Type *</label>
            <ProductTypeDropdown 
              value={productData.productType} 
              onChange={handleProductTypeChange} 
              selectedCategory={productData.category}
              required
            />
            <p className="helper-text">Pick a subcategory that best fits your item</p>
          </div>

          <div className="form-group">
            <label htmlFor="condition">Condition *</label>
            <ConditionDropdown 
              value={productData.condition} 
              onChange={handleConditionChange} 
            />
            <p className="helper-text">Select the condition of your product</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="add-product-button"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedStep1()}
            >
              Continue
            </button>
            <button type="button" onClick={resetForm} className="reset-button">
              Reset
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Remaining details */}
      {currentStep === 2 && (
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input type="text" name="name" id="name" value={productData.name} onChange={handleChange} required />
            <p className="helper-text">Enter a clear and descriptive name for your product</p>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea name="description" id="description" value={productData.description} onChange={handleChange} required rows="4" placeholder="Provide a detailed description of your product..."></textarea>
            <p className="helper-text">Describe your product's features, benefits, and specifications in detail</p>
            <DescriptionHelper 
              category={productData.category}
              description={productData.description}
              onDescriptionChange={(newDescription) => setProductData(prev => ({ ...prev, description: newDescription }))}
            />
          </div>

          <div className="form-group">
              <label htmlFor="price">Price (UGX) *</label>
              <input type="number" name="price" id="price" value={productData.price} onChange={handleChange} required min="0" step="0.01" />
              <p className="helper-text">Enter the price in UGX.</p>
          </div>

          <div className="form-group">
              <label htmlFor="stock">Stock Quantity *</label>
              <input type="number" name="stock" id="stock" value={productData.stock} onChange={handleChange} required min="0" step="1" />
              <p className="helper-text">Enter how many units are available for sale</p>
          </div>

          <div className="form-group">
            <label htmlFor="specifications">Specifications</label>
            <textarea name="specifications" id="specifications" value={productData.specifications} onChange={handleChange} rows="3" placeholder={"e.g., Color: Red\nSize: Large\nWeight: 2kg"}></textarea>
            <p className="helper-text">List key specifications, one per line (e.g., dimensions, weight, color)</p>
          </div>

          <div className="form-group">
            <label htmlFor="features">Features</label>
            <textarea name="features" id="features" value={productData.features} onChange={handleChange} rows="3" placeholder={"e.g., Durable\nLightweight\nEasy to use"}></textarea>
            <p className="helper-text">List product features and benefits, one per line</p>
          </div>

          <div className="form-group">
            <label htmlFor="images">Product Images</label>
            <input type="file" name="images" id="images" onChange={handleImageChange} multiple accept="image/*" />
            <p className="helper-text">Upload clear images of your product (max 5). Hold Ctrl to select multiple files.</p>
          </div>
          
          {/* Preset Image Selector */}
          <PresetImageSelector 
            selectedCategory={productData.category}
            selectedSubcategory={productData.productType}
            productName={productData.name}
            onImageSelect={handlePresetImageSelect}
            selectedImages={selectedPresetImages}
            maxSelections={5}
          />
          
          {imagePreviews.length > 0 && (
              <div className="image-preview-container">
                  {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview">
                          <img src={preview} alt={`preview ${index}`} />
                          <button type="button" onClick={() => removeImage(index)} className="remove-image-btn">X</button>
                      </div>
                  ))}
              </div>
          )}
          
          {selectedPresetImages.length > 0 && (
              <div className="preset-image-preview-container">
                  <h4>Selected Preset Images</h4>
                  {selectedPresetImages.map((image, index) => (
                      <div key={`preset-${index}`} className="image-preview">
                          <img src={image.url} alt={`preset ${index}`} />
                          <button type="button" onClick={() => handlePresetImageSelect(selectedPresetImages.filter((_, i) => i !== index))} className="remove-image-btn">X</button>
                      </div>
                  ))}
              </div>
          )}

          <div className="form-actions">
            <button type="button" className="reset-button" onClick={() => setCurrentStep(1)}>
              Back
            </button>
            <button type="submit" disabled={loading} className="add-product-button">
                {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddProductPage;
