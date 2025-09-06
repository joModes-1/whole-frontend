import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CategoryDropdown from '../../components/CategoryDropdown';
import ProductTypeDropdown from '../../components/ProductTypeDropdown';
// Removed ConditionDropdown in favor of a simple New/Old selector for cereals/grains
import DescriptionHelper from '../../components/DescriptionHelper';
import PresetImageSelector from '../../components/PresetImageSelector';
import './AddProductPage.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Category metadata structure
const categoryMetadata = {
  "Beverages": {
    structuredFields: ['sizePackaging', 'weightVolume', 'gradeQuality', 'shelfLife'],
    fieldOptions: {
      sizePackaging: ['1 L bottle', '500 ml bottle', '330 ml can', '5 L jerrycan', 'Pack of 6', 'Pack of 12', 'Custom'],
      weightVolume: ['1 L', '500 ml', '330 ml', '5 L', 'Custom'],
      gradeQuality: ['Premium', 'Standard', 'Economy', 'Custom'],
      shelfLife: ['6 months', '12 months', '24 months', 'Custom']
    }
  },
  "Cereals & Grains": {
    structuredFields: ['sizePackaging', 'weightVolume', 'gradeQuality', 'shelfLife'],
    fieldOptions: {
      sizePackaging: ['50 kg bag', '25 kg bag', '10 kg bag', '5 kg bag', '1 kg bag', 'Bulk', 'Custom'],
      weightVolume: ['50 kg', '25 kg', '10 kg', '5 kg', '1 kg', 'Custom'],
      gradeQuality: ['Grade 1', 'Grade 2', 'Grade A', 'Premium', 'Extra Fine', 'Custom'],
      shelfLife: ['6 months', '12 months', '18 months', '24 months', 'Custom']
    }
  },
  "Electronics": {
    structuredFields: ['sizePackaging', 'weightVolume'],
    fieldOptions: {
      sizePackaging: ['Small', 'Medium', 'Large', 'Custom'],
      weightVolume: ['100 g', '250 g', '500 g', '1 kg', 'Custom'],
      gradeQuality: ['Custom'],
      shelfLife: ['Custom']
    }
  },
  "Clothing": {
    structuredFields: ['sizePackaging', 'gradeQuality'],
    fieldOptions: {
      sizePackaging: ['Small', 'Medium', 'Large', 'XL', 'XXL', 'Custom'],
      weightVolume: ['Custom'],
      gradeQuality: ['Premium', 'Standard', 'Economy', 'Custom'],
      shelfLife: ['Custom']
    }
  },
  "Home & Garden": {
    structuredFields: ['sizePackaging', 'weightVolume'],
    fieldOptions: {
      sizePackaging: ['Small', 'Medium', 'Large', 'Custom'],
      weightVolume: ['100 g', '250 g', '500 g', '1 kg', '5 kg', 'Custom'],
      gradeQuality: ['Premium', 'Standard', 'Custom'],
      shelfLife: ['Custom']
    }
  },
  "Sports": {
    structuredFields: ['sizePackaging', 'weightVolume'],
    fieldOptions: {
      sizePackaging: ['Small', 'Medium', 'Large', 'Custom'],
      weightVolume: ['100 g', '250 g', '500 g', '1 kg', 'Custom'],
      gradeQuality: ['Premium', 'Standard', 'Custom'],
      shelfLife: ['Custom']
    }
  },
  "Books": {
    structuredFields: ['weightVolume', 'gradeQuality'],
    fieldOptions: {
      sizePackaging: ['Custom'],
      weightVolume: ['100 g', '250 g', '500 g', '1 kg', 'Custom'],
      gradeQuality: ['New', 'Used', 'Custom'],
      shelfLife: ['Custom']
    }
  }
};

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
    // Structured fields (optional)
    sizePackaging: '',
    weightVolume: '',
    gradeQuality: '',
    shelfLife: '',
    // Custom overrides when "Custom" selected
    sizePackagingCustom: '',
    weightVolumeCustom: '',
    gradeQualityCustom: '',
    shelfLifeCustom: '',
  });
  const [priceDisplay, setPriceDisplay] = useState('');
  
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

  // Determine if selected category is cereals/grains (flexible match)
  const isCerealsGrains = useMemo(() => {
    const c = (productData.category || '').toLowerCase();
    return c.includes('cereal') || c.includes('grain');
  }, [productData.category]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    // Price uses its own handler to maintain formatted display with commas
    if (name === 'price') return;
    setProductData(prev => ({ ...prev, [name]: value }));
    
    // Auto-detect category based on product name
    if (name === 'name') {
      const detectedCategory = detectCategory(value);
      if (detectedCategory && !userSelectedCategory) {
        setProductData(prev => ({ ...prev, category: detectedCategory }));
      }
    }
  };

  // Handle price input with commas. Keep numeric string in productData.price
  const handlePriceChange = (e) => {
    const raw = e.target.value;
    // Allow only digits
    const digits = (raw || '').replace(/[^0-9]/g, '');
    // Update underlying numeric value (no commas)
    setProductData(prev => ({ ...prev, price: digits }));
    // Format with commas for display
    if (digits === '') {
      setPriceDisplay('');
    } else {
      const withCommas = Number(digits).toLocaleString('en-UG');
      setPriceDisplay(withCommas);
    }
  };

  const handleProductTypeChange = (productType) => {
    // Get structured fields for this category
    const categoryMeta = categoryMetadata[productData.category] || {};
    const structuredFields = categoryMeta.structuredFields || [];
    
    setProductData(prev => {
      // Reset all structured fields
      const resetFields = {
        sizePackaging: '',
        weightVolume: '',
        gradeQuality: '',
        shelfLife: '',
        sizePackagingCustom: '',
        weightVolumeCustom: '',
        gradeQualityCustom: '',
        shelfLifeCustom: '',
      };
      
      // Only keep values for fields that are relevant to this category
      const relevantFields = {};
      structuredFields.forEach(field => {
        relevantFields[field] = prev[field] || '';
        // Also keep custom field values
        if (prev[`${field}Custom`]) {
          relevantFields[`${field}Custom`] = prev[`${field}Custom`];
        }
      });
      
      return {
        ...prev,
        productType,
        ...resetFields,
        ...relevantFields
      };
    });
  };

  const handleConditionChange = (condition) => {
    setProductData(prev => ({ ...prev, condition }));
  };
  
  // Function to automatically detect category based on product name
  const detectCategory = (productName) => {
    if (!productName) return null;
    
    const lowerName = productName.toLowerCase();
    
    // Check each category in the metadata for matching keywords
    for (const categoryName in categoryMetadata) {
      // Convert category name to lowercase for comparison
      const categoryKey = categoryName.toLowerCase();
      
      // Split category name into keywords
      const categoryKeywords = categoryKey.split('&').map(k => k.trim()).concat(
        categoryKey.split(' ').map(k => k.trim())
      ).filter(k => k.length > 0);
      
      // Check if any of the category keywords match the product name
      if (categoryKeywords.some(keyword => lowerName.includes(keyword))) {
        return categoryName;
      }
    }
    
    return null;
  };

  const handleCategoryChange = useCallback((category) => {
    // Extract category name if category is an object
    const categoryName = typeof category === 'object' ? category.name : category;
    
    // Get structured fields for this category
    const categoryMeta = categoryMetadata[categoryName] || {};
    const structuredFields = categoryMeta.structuredFields || [];
    
    setProductData(prev => {
      // Reset all structured fields
      const resetFields = {
        sizePackaging: '',
        weightVolume: '',
        gradeQuality: '',
        shelfLife: '',
        sizePackagingCustom: '',
        weightVolumeCustom: '',
        gradeQualityCustom: '',
        shelfLifeCustom: '',
      };
      
      // Only keep values for fields that are relevant to this category
      const relevantFields = {};
      structuredFields.forEach(field => {
        relevantFields[field] = prev[field] || '';
        // Also keep custom field values
        if (prev[`${field}Custom`]) {
          relevantFields[`${field}Custom`] = prev[`${field}Custom`];
        }
      });
      
      return {
        ...prev,
        category: categoryName,
        // If leaving cereals/grains, clear any previously selected condition
        condition: (categoryName || '').toLowerCase().includes('cereal') || (categoryName || '').toLowerCase().includes('grain')
          ? (['New', 'Old'].includes(prev.condition) ? prev.condition : '')
          : '',
        ...resetFields,
        ...relevantFields
      };
    });
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
      sizePackaging: '',
      weightVolume: '',
      gradeQuality: '',
      shelfLife: '',
      sizePackagingCustom: '',
      weightVolumeCustom: '',
      gradeQualityCustom: '',
      shelfLifeCustom: '',
    });
    setPriceDisplay('');
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
    // Only require condition for cereals/grains
    if (isCerealsGrains && !productData.condition) {
      errors.push('Please select a condition');
    }

    // Step 2 validations
    if (!productData.name.trim()) {
      errors.push('Product name is required');
    }
    
    if (!productData.description.trim()) {
      errors.push('Product description is required');
    }
    
    if (Number(productData.price) <= 0) {
      errors.push('Price must be greater than zero');
    }
    
    if (productData.stock < 0) {
      errors.push('Stock quantity cannot be negative');
    }
    
    // Context-sensitive validation for structured fields
    const categoryMeta = categoryMetadata[productData.category] || {};
    const structuredFields = categoryMeta.structuredFields || [];
    
    // Validate only the structured fields that are relevant to the selected category
    structuredFields.forEach(field => {
      // If the field has a value, validate the custom field if needed
      if (productData[field] === 'Custom' && !productData[`${field}Custom`].trim()) {
        errors.push(`${field} custom value is required when 'Custom' is selected`);
      }
    });
    
    return errors;
  };

  const canProceedStep1 = () => {
    if (!productData.category || !productData.productType) return false;
    return isCerealsGrains ? Boolean(productData.condition) : true;
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
      // Only include condition for cereals/grains
      if (isCerealsGrains && productData.condition) {
        formData.append('condition', productData.condition);
      }
      formData.append('stock', productData.stock);
      formData.append('specifications', JSON.stringify(specObject));
      formData.append('features', JSON.stringify(featuresArray));

      // Structured fields: use custom value if present, else selected option
      const categoryMeta = categoryMetadata[productData.category] || {};
      const structuredFields = categoryMeta.structuredFields || [];
      
      structuredFields.forEach(field => {
        const fieldValue = productData[field] === 'Custom' ? productData[`${field}Custom`] : productData[field];
        if (fieldValue) formData.append(field, fieldValue);
      });

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
        features: '',
        sizePackaging: '',
        weightVolume: '',
        gradeQuality: '',
        shelfLife: '',
        sizePackagingCustom: '',
        weightVolumeCustom: '',
        gradeQualityCustom: '',
        shelfLifeCustom: '',
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
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>2. Details & Specs</div>
        <div className={`step ${currentStep === 3 ? 'active' : ''}`}>3. Images</div>
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

          {isCerealsGrains && (
            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={productData.condition}
                onChange={(e) => handleConditionChange(e.target.value)}
                required
              >
                <option value="" disabled>Select condition</option>
                <option value="New">New</option>
                <option value="Old">Old</option>
              </select>
              <p className="helper-text">Select the condition (only required for cereals and grains)</p>
            </div>
          )}

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

      {/* STEP 2: Remaining details & structured fields */}
      {currentStep === 2 && (
        <div className="add-product-form">
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
              <input
                type="text"
                name="price"
                id="price"
                inputMode="numeric"
                value={priceDisplay}
                onChange={handlePriceChange}
                required
                placeholder="e.g., 1,200,000"
              />
              <p className="helper-text">Enter the price in UGX. Commas will be added automatically.</p>
          </div>

          <div className="form-group">
              <label htmlFor="stock">Stock Quantity *</label>
              <input type="number" name="stock" id="stock" value={productData.stock} onChange={handleChange} required min="0" step="1" />
              <p className="helper-text">Enter how many units are available for sale</p>
          </div>

          {/* Structured fields - optional with predefined lists and Custom option */}
          {/* Dynamically render structured fields based on category metadata */}
          {categoryMetadata[productData.category] && categoryMetadata[productData.category].structuredFields.map(field => {
            const options = categoryMetadata[productData.category].fieldOptions[field] || [];
            const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            return (
              <div className="form-group" key={field}>
                <label htmlFor={field}>{fieldLabel}</label>
                <select
                  id={field}
                  name={field}
                  value={productData[field]}
                  onChange={(e) => setProductData(prev => ({ ...prev, [field]: e.target.value, [`${field}Custom`]: e.target.value === 'Custom' ? prev[`${field}Custom`] : '' }))}
                >
                  <option value="">Select</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {productData[field] === 'Custom' && (
                  <input type="text" placeholder={`Enter custom ${fieldLabel.toLowerCase()}`} value={productData[`${field}Custom`]} onChange={(e) => setProductData(prev => ({ ...prev, [`${field}Custom`]: e.target.value }))} />
                )}
              </div>
            );
          })}

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

          <div className="form-actions">
            <button type="button" className="reset-button" onClick={() => setCurrentStep(1)}>
              Back
            </button>
            <button type="button" disabled={loading} className="add-product-button" onClick={() => setCurrentStep(3)}>
              Continue
            </button>
          </div>
        </div>
       )}

      {/* STEP 3: Images */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="add-product-form">
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
            <button type="button" className="reset-button" onClick={() => setCurrentStep(2)}>
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
