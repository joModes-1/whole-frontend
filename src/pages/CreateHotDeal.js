import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPercent, FaGift, FaTruck, FaDollarSign, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import './CreateHotDeal.css';

const CreateHotDeal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  // const [mode, setMode] = useState('existing'); // 'existing' or 'new' - unused for now
  const [formData, setFormData] = useState({
    // Product selection (existing mode)
    productId: '',
    // New product fields
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    // Hot deal fields
    hotDealType: 'percentage',
    discountPercentage: '',
    discountAmount: '',
    buyQuantity: '',
    getFreeQuantity: '',
    dealDescription: '',
    dealStartDate: '',
    dealEndDate: ''
  });

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products/seller/my-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productId) {
      alert('Please select a product');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Update existing product to hot deal
      const updateData = {
        isHotDeal: true,
        hotDealType: formData.hotDealType,
        dealDescription: formData.dealDescription,
        dealStartDate: formData.dealStartDate || undefined,
        dealEndDate: formData.dealEndDate || undefined
      };

      // Add type-specific fields
      if (formData.hotDealType === 'percentage') {
        updateData.discountPercentage = Number(formData.discountPercentage);
      } else if (formData.hotDealType === 'fixed_amount') {
        updateData.discountAmount = Number(formData.discountAmount);
      } else if (formData.hotDealType === 'buy_x_get_y') {
        updateData.buyQuantity = Number(formData.buyQuantity);
        updateData.getFreeQuantity = Number(formData.getFreeQuantity);
      }

      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/products/seller/${formData.productId}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Hot deal created successfully!');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Error creating hot deal:', error);
      alert('Error creating hot deal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDealTypeIcon = (type) => {
    switch (type) {
      case 'percentage': return <FaPercent />;
      case 'fixed_amount': return <FaDollarSign />;
      case 'buy_x_get_y': return <FaGift />;
      case 'free_delivery': return <FaTruck />;
      default: return <FaPercent />;
    }
  };

  const renderDealTypeFields = () => {
    switch (formData.hotDealType) {
      case 'percentage':
        return (
          <div className="form-group">
            <label htmlFor="discountPercentage">Discount Percentage (%)</label>
            <input
              type="number"
              id="discountPercentage"
              name="discountPercentage"
              value={formData.discountPercentage}
              onChange={handleInputChange}
              min="1"
              max="100"
              required
              placeholder="e.g., 20"
            />
          </div>
        );

      case 'fixed_amount':
        return (
          <div className="form-group">
            <label htmlFor="discountAmount">Discount Amount (UGX)</label>
            <input
              type="number"
              id="discountAmount"
              name="discountAmount"
              value={formData.discountAmount}
              onChange={handleInputChange}
              min="1"
              required
              placeholder="e.g., 5000"
            />
          </div>
        );

      case 'buy_x_get_y':
        return (
          <>
            <div className="form-group">
              <label htmlFor="buyQuantity">Buy Quantity</label>
              <input
                type="number"
                id="buyQuantity"
                name="buyQuantity"
                value={formData.buyQuantity}
                onChange={handleInputChange}
                min="1"
                required
                placeholder="e.g., 2"
              />
            </div>
            <div className="form-group">
              <label htmlFor="getFreeQuantity">Get Free Quantity</label>
              <input
                type="number"
                id="getFreeQuantity"
                name="getFreeQuantity"
                value={formData.getFreeQuantity}
                onChange={handleInputChange}
                min="1"
                required
                placeholder="e.g., 1"
              />
            </div>
          </>
        );

      case 'free_delivery':
        return (
          <div className="info-box">
            <FaInfoCircle />
            <p>Free delivery will be applied to this product automatically.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-hot-deal-container">
      <div className="create-hot-deal-card">
        <div className="page-header">
          <h1>Create Hot Deal</h1>
          <p>Set up special offers and discounts for your products</p>
        </div>

        <form onSubmit={handleSubmit} className="hot-deal-form">

          <div className="form-group">
            <label htmlFor="productId">Select Product</label>
            <select
              id="productId"
              name="productId"
              value={formData.productId}
              onChange={handleInputChange}
              required
            >
              <option value="">Choose a product...</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} - UGX {product.price}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hotDealType">Deal Type</label>
            <div className="deal-type-grid">
              {[
                { value: 'percentage', label: 'Percentage Discount', desc: 'e.g., 20% off' },
                { value: 'fixed_amount', label: 'Fixed Amount Off', desc: 'e.g., UGX 5,000 off' },
                { value: 'buy_x_get_y', label: 'Buy X Get Y Free', desc: 'e.g., Buy 2 Get 1 Free' },
                { value: 'free_delivery', label: 'Free Delivery', desc: 'No shipping charges' }
              ].map(type => (
                <div
                  key={type.value}
                  className={`deal-type-option ${formData.hotDealType === type.value ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, hotDealType: type.value }))}
                >
                  <div className="deal-type-icon">
                    {getDealTypeIcon(type.value)}
                  </div>
                  <div className="deal-type-content">
                    <h4>{type.label}</h4>
                    <p>{type.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {renderDealTypeFields()}

          <div className="form-group">
            <label htmlFor="dealDescription">Deal Description (Optional)</label>
            <textarea
              id="dealDescription"
              name="dealDescription"
              value={formData.dealDescription}
              onChange={handleInputChange}
              placeholder="Describe your hot deal offer..."
              maxLength="200"
              rows="3"
            />
            <small>{formData.dealDescription.length}/200 characters</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dealStartDate">
                <FaCalendarAlt /> Start Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="dealStartDate"
                name="dealStartDate"
                value={formData.dealStartDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="dealEndDate">
                <FaCalendarAlt /> End Date (Optional)
              </label>
              <input
                type="datetime-local"
                id="dealEndDate"
                name="dealEndDate"
                value={formData.dealEndDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Hot Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHotDeal;
