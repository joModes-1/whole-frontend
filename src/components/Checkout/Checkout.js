import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/orderService';
import api from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { normalizeUgandanPhone, isValidUgandanPhone } from '../../utils/phoneUtils';
import './Checkout.css';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    subCounty: '',
    district: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [shippingCost, setShippingCost] = useState(0); // Will be calculated dynamically
  const [taxAmount, setTaxAmount] = useState(0); // No tax for COD
  const [isProfileLoading] = useState(false);

  // Currency formatter for UGX (no cents)
  const formatUGX = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return `UGX ${Math.round(amount || 0).toLocaleString('en-UG')}`;
    }
  }, []);

  useEffect(() => {
    // No tax calculation - tax is removed
    setTaxAmount(0);
  }, [total]);

  // Pre-populate shipping info with user's default location
  useEffect(() => {
    if (user) {
      const userLocation = user.role === 'seller' ? user.businessLocation : user.deliveryAddress;
      
      if (userLocation) {
        setShippingInfo(prev => ({
          ...prev,
          fullName: user.name || prev.fullName,
          phone: user.phoneNumber || prev.phone,
          // Use formatted address if available, otherwise use individual address field
          address: userLocation.formattedAddress || userLocation.address || prev.address,
          district: userLocation.city || prev.district,
          subCounty: userLocation.state || prev.subCounty,
          // Store coordinates for location-based calculations
          coordinates: userLocation.coordinates?.coordinates || prev.coordinates
        }));
      } else {
        // If no location data, just pre-fill name and phone
        setShippingInfo(prev => ({
          ...prev,
          fullName: user.name || prev.fullName,
          phone: user.phoneNumber || prev.phone
        }));
      }
    }
  }, [user]);

  const calculateShippingAndTax = useCallback(async () => {
    try {
      // Try to calculate based on coordinates first
      if (shippingInfo.coordinates && shippingInfo.coordinates.length === 2) {
        const response = await api.post('/delivery-settings/calculate-fee', {
          coordinates: shippingInfo.coordinates,
          orderTotal: total
        });
        setShippingCost(response.data.deliveryFee);
      } 
      // Fallback to district-based calculation
      else if (shippingInfo.district) {
        const response = await api.post('/delivery-settings/calculate-fee-by-district', {
          district: shippingInfo.district,
          orderTotal: total
        });
        setShippingCost(response.data.deliveryFee);
      } 
      // Default to base fee from settings
      else {
        const response = await api.get('/delivery-settings/settings');
        setShippingCost(response.data.baseDeliveryFee);
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      // Fallback to a default fee if API fails
      setShippingCost(5000);
    }
    
    setTaxAmount(0); // No tax
  }, [total, shippingInfo.district, shippingInfo.coordinates]);

  useEffect(() => {
    if (cart && cart.length > 0) {
      console.log('Cart items:', cart);
      console.log('Cart total:', total);
      
      // Calculate shipping and tax
      calculateShippingAndTax();
    }
  }, [cart, total, shippingInfo.district, shippingInfo.coordinates, calculateShippingAndTax]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Store as [longitude, latitude] for GeoJSON compatibility
          setShippingInfo(prev => ({
            ...prev,
            coordinates: [position.coords.longitude, position.coords.latitude]
          }));
          alert('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please ensure location permissions are enabled.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const formatOrderData = useCallback(() => {
    try {
      if (!cart || cart.length === 0) throw new Error('Cart is empty');

      const sellerId = cart[0]?.seller?._id || cart[0]?.seller;
      if (!sellerId) throw new Error('Seller information is missing from cart items.');

      const orderPayload = {
        seller: sellerId,
        items: cart.map(item => ({
          listing: item._id,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        })),
        shippingInfo,
        shippingMethod: 'standard',
        notes: '',
        saveAddress,
        paymentMethod,
        shippingCost,
        taxAmount,
        totalAmount: total + shippingCost
      };

      if (!user || !user._id) throw new Error('User user information is missing or invalid.');

      return {
        buyer: user._id,
        seller: sellerId,
        ...orderPayload,
        shippingInfo: {
          ...shippingInfo,
          address: `${shippingInfo.address}, ${shippingInfo.subCounty}, ${shippingInfo.district}`,
          coordinates: shippingInfo.coordinates || null
        },
        status: 'pending'
      };
    } catch (error) {
      console.error('Error in formatOrderData:', error);
      throw error;
    }
  }, [cart, total, user, shippingInfo, paymentMethod, shippingCost, taxAmount, saveAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }
    
    // Validate shipping info
    if (!shippingInfo.fullName || !shippingInfo.phone || 
        !shippingInfo.subCounty || !shippingInfo.district || !shippingInfo.address) {
      setError('Please fill in all shipping information fields.');
      return;
    }
    
    // Validate phone number format
    if (!isValidUgandanPhone(shippingInfo.phone)) {
      setError('Please enter a valid Ugandan phone number (e.g., 0700000000 or +256700000000).');
      return;
    }
    
    if (!user) {
      setError('User user is not loaded. Cannot proceed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Normalize phone number before creating order
      const normalizedShippingInfo = {
        ...shippingInfo,
        phone: normalizeUgandanPhone(shippingInfo.phone)
      };
      
      const orderPayload = formatOrderData();
      if (!orderPayload) {
        throw new Error("Could not format order data.");
      }
      
      // Update the order payload with normalized phone
      orderPayload.shippingInfo.phone = normalizedShippingInfo.phone;

      const newOrder = await createOrder(orderPayload);

      if (saveAddress) {
        await api.put('/profile', { address: shippingInfo });
      }

      // Handle payment processing based on selected method
      if (paymentMethod === 'cod') {
        // For Cash on Delivery, just redirect to success page
        clearCart();
        navigate(`/order-success?order_id=${newOrder._id}`);
      } else {
        // For other payment methods, redirect to payment processing page
        // Don't clear cart here - it should only be cleared after successful payment
        navigate(`/process-payment?order_id=${newOrder._id}&method=${paymentMethod}`);
      }

    } catch (err) {
      console.error('Checkout process failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for shipping form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Function to reload user's default address
  const loadDefaultAddress = () => {
    if (user) {
      const userLocation = user.role === 'seller' ? user.businessLocation : user.deliveryAddress;
      
      if (userLocation) {
        setShippingInfo(prev => ({
          ...prev,
          fullName: user.name || '',
          phone: user.phoneNumber || '',
          address: userLocation.formattedAddress || userLocation.address || '',
          district: userLocation.city || '',
          subCounty: userLocation.state || '',
          coordinates: userLocation.coordinates?.coordinates || null
        }));
      }
    }
  };

  if (isProfileLoading || !user) {
    return (
      <div className="checkout-container" style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="user-loading-message">
          <div className="spinner" style={{marginBottom: 18}}></div>
          <span style={{fontSize: '1.15rem', color: '#0264f1', fontWeight: 500}}>Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        {/* Shipping Form */}
        <section className="shipping-form">
          <h3>Shipping Information</h3>
          {user && (user.businessLocation || user.deliveryAddress) && (
            <div className="info-message" style={{
              backgroundColor: '#e8f4fd', 
              border: '1px solid #0264f1', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              fontSize: '14px',
              color: '#0264f1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>ℹ️ We've pre-filled your shipping information from your account. You can edit it if needed.</span>
              <button 
                type="button" 
                onClick={loadDefaultAddress}
                style={{
                  background: 'none',
                  border: '1px solid #0264f1',
                  color: '#0264f1',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Reload Default
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={shippingInfo.phone} 
                onChange={handleInputChange} 
                placeholder="0700000000 or +256700000000"
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="district">District</label>
              <input type="text" id="district" name="district" value={shippingInfo.district} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="subCounty">Sub County</label>
              <input type="text" id="subCounty" name="subCounty" value={shippingInfo.subCounty} onChange={handleInputChange} required />
            </div>
            {/* Location button right below Sub County, aligned to the right */}
            <div className="form-row-actions">
              <button type="button" className="location-button" onClick={handleGetLocation}>
                Use My Current Location
              </button>
            </div>
            <div className="form-group">
              <label htmlFor="address">Specific Address/Directions</label>
              <textarea id="address" name="address" value={shippingInfo.address} onChange={handleInputChange} required />
            </div>
            {/* standalone location button removed; now inline with address field */}
            <div className="form-group">
              <label className="save-address-label">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this shipping address to my user
              </label>
            </div>
            {/* Payment Methods moved before submit */}
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-options-grid">
                {stripePromise && (
                  <button type="button" className={`payment-option-btn ${paymentMethod === 'stripe' ? 'selected' : ''}`} onClick={() => handlePaymentMethodChange('stripe')}>
                    <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c257a7d9680175868a94c8c2571df.svg" alt="Stripe" />
                    <span>Credit Card</span>
                  </button>
                )}
                <button type="button" className={`payment-option-btn ${paymentMethod === 'paypal' ? 'selected' : ''}`} onClick={() => handlePaymentMethodChange('paypal')}>
                  <img src="https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png" alt="PayPal" />
                  <span>PayPal</span>
                </button>
                <button type="button" className={`payment-option-btn ${paymentMethod === 'airtel' ? 'selected' : ''}`} onClick={() => handlePaymentMethodChange('airtel')}>
                  <img src="/images/airtel-money-logo.png" alt="Airtel Money" onError={(e)=>{e.currentTarget.style.display='none';}} />
                  <span>Airtel Money</span>
                </button>
                <button type="button" className={`payment-option-btn ${paymentMethod === 'mtn' ? 'selected' : ''}`} onClick={() => handlePaymentMethodChange('mtn')}>
                  <img src="/images/MoMo-Pay-Icon-1.png" alt="MTN MoMo" onError={(e)=>{e.currentTarget.style.display='none';}} />
                  <span>MTN MoMo</span>
                </button>
                <button
                  type="button"
                  className={`payment-option-btn ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodChange('cod')}
                >
                  <img
                    src="https://img.icons8.com/ios-filled/50/cash-on-delivery.png"
                    width="50"
                    height="50"
                    alt="cash-on-delivery"
                    onError={(e)=>{ e.currentTarget.src = '/images/cash-on-delivery.svg'; }}
                  />
                  <span>Cash on Delivery</span>
                </button>
              </div>
              {paymentMethod === 'cod' && (
                <div className="cod-info modern-card">
                  <span style={{color: '#0264f1', fontWeight: 600, fontSize: '1.08rem'}}>
                    Pay with cash when your order is delivered. No online payment required.
                  </span>
                </div>
              )}
            </div>
            <button className="place-order-button" type="submit" disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </form>
        </section>

        {/* Order Summary */}
        <section className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map((item) => {
              // Resolve product image from multiple possible shapes
              let candidate = null;
              if (Array.isArray(item.images) && item.images.length > 0) {
                const first = item.images[0];
                candidate = typeof first === 'string' ? first : (first?.url || first?.path || null);
              }
              if (!candidate) candidate = item.image || item.imagePath || item.thumbnail || null;
              // Build full URL only for relative paths
              let imageUrl = '/placeholder-image.svg';
              if (candidate) {
                if (typeof candidate === 'string' && (candidate.startsWith('http://') || candidate.startsWith('https://'))) {
                  imageUrl = candidate;
                } else if (typeof candidate === 'string') {
                  imageUrl = `${API_BASE_URL}${candidate}`;
                }
              }
              return (
                <div key={item._id} className="summary-item">
                  <img
                    className="summary-item-image"
                    src={imageUrl}
                    alt={item.name}
                    onError={(e) => { e.currentTarget.src = '/placeholder-image.svg'; }}
                  />
                  <div className="summary-item-details">
                    <span>{item.name} x {item.quantity}</span>
                    <strong>{formatUGX(item.price * item.quantity)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="summary-breakdown">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>{formatUGX(total)}</span>
            </div>
            <div className="summary-line">
              <span>Delivery Fee:</span>
              <span>{shippingCost === 0 && total >= 100000 ? 'FREE' : formatUGX(shippingCost)}</span>
            </div>
            <div className="summary-total">
              <span>Total:</span>
              <span>{formatUGX(total + shippingCost)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Payment section removed; now inside the form above submit */}
    </div>
  );
};

export default Checkout;
