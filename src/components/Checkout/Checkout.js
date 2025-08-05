import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/orderService';
import api from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import './Checkout.css';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const { token, user } = useAuth();

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    subCounty: '',
    district: '',
    country: 'Uganda',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    if (cart && cart.length > 0) {
      console.log('Cart items:', cart);
      console.log('Cart total:', total);
    }
  }, [cart, total]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token || !user) return;
      setIsProfileLoading(true);
      try {
        setShippingInfo(prev => ({
          ...prev,
          fullName: user?.name || '',
          phone: user?.contactNumber || '',
          address: user?.address?.street || '',
          city: user?.address?.city || '',
          state: user?.address?.state || '',
          subCounty: user?.address?.subCounty || '',
          district: user?.address?.district || '',
          country: user?.address?.country || 'Uganda',
        }));
        if (!user || !user._id) {
          setError('Could not load your user user. Please refresh or contact support.');
        }
      } catch (err) {
        console.error('Error processing user:', err);
        setError('Failed to process your user information. Using default shipping info.');
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleShippingChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePaymentMethodChange = (method) => {
    setError('');
    setPaymentMethod(method);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const locationData = await response.json();
            
            setShippingInfo(prev => ({
              ...prev,
              city: locationData.city || prev.city,
              district: locationData.locality || prev.district,
              subCounty: locationData.localityInfo?.administrative?.[1]?.name || prev.subCounty,
              country: locationData.countryName || prev.country
            }));
          } catch (err) {
            console.error('Error getting location data:', err);
            setError('Could not retrieve location details. Please fill in manually.');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your location. Please fill in manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const formatOrderData = useCallback(() => {
    try {
      const tax = total * 0.1; // 10% tax
      const subtotal = total;
      if (!cart || cart.length === 0) throw new Error('Cart is empty');

      const sellerId = cart[0]?.seller?._id || cart[0]?.seller;
      if (!sellerId) throw new Error('Seller information is missing from cart items.');

      const formattedItems = cart.map(item => ({
        listing: item._id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
        seller: item.seller?._id || item.seller
      }));

      if (!user || !user._id) throw new Error('User user information is missing or invalid.');

      const orderPayload = {
        buyer: user._id,
        seller: sellerId,
        items: formattedItems,
        shippingInfo: {
          ...shippingInfo,
          address: `${shippingInfo.address}, ${shippingInfo.subCounty}, ${shippingInfo.district}`
        },
        paymentMethod,
        subtotal,
        tax,
        totalAmount: subtotal + tax,
        status: 'pending'
      };
      return orderPayload;
    } catch (error) {
      console.error('Error in formatOrderData:', error);
      throw error;
    }
  }, [cart, total, user, shippingInfo, paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }
    
    // Validate shipping info
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.city || 
        !shippingInfo.subCounty || !shippingInfo.district || !shippingInfo.address) {
      setError('Please fill in all shipping information fields.');
      return;
    }
    
    if (!user) {
      setError('User user is not loaded. Cannot proceed.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderPayload = formatOrderData();
      if (!orderPayload) {
        throw new Error("Could not format order data.");
      }

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

  if (isProfileLoading || !user) {
    return (
      <div className="checkout-container" style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div className="user-loading-message">
          <div className="spinner" style={{marginBottom: 18}}></div>
          <span style={{fontSize: '1.15rem', color: '#0264f1', fontWeight: 500}}>Loading your user...</span>
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
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input type="text" id="fullName" name="fullName" value={shippingInfo.fullName} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={shippingInfo.phone} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input type="text" id="city" name="city" value={shippingInfo.city} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="subCounty">Sub County</label>
              <input type="text" id="subCounty" name="subCounty" value={shippingInfo.subCounty} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="district">District</label>
              <input type="text" id="district" name="district" value={shippingInfo.district} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="address">Specific Address/Directions</label>
              <textarea id="address" name="address" value={shippingInfo.address} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input type="text" id="country" name="country" value={shippingInfo.country} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <button type="button" className="location-button" onClick={handleGetLocation}>
                Use My Current Location
              </button>
            </div>
            <div className="form-group">
              <label className="save-address-label">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this shipping address to my user
              </label>
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
              const imageUrl = item.imagePath
                ? `${API_BASE_URL}${item.imagePath}`
                : 'https://via.placeholder.com/60x60.png?text=No+Image';
              return (
                <div key={item._id} className="summary-item">
                  <img className="summary-item-image" src={imageUrl} alt={item.name} />
                  <div className="summary-item-details">
                    <span>{item.name} x {item.quantity}</span>
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="summary-total">
            <span>Total:</span>
            <span>${(total * 1.1).toFixed(2)}</span>
          </div>
        </section>
      </div>

      {/* Payment Options */}
      <section className="payment-section">
        <h2>Select Payment Method</h2>
        <hr />
        <div className="payment-methods">
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
              <img src="/images/airtel-money-logo.png" alt="Airtel Money" />
              <span>Airtel Money</span>
            </button>
            <button type="button" className={`payment-option-btn ${paymentMethod === 'mtn' ? 'selected' : ''}`} onClick={() => handlePaymentMethodChange('mtn')}>
              <img src="/images/mtn-momo-logo.png" alt="MTN MoMo" />
              <span>MTN MoMo</span>
            </button>
          {/* Add Cash on Delivery Option */}
            <button
              type="button"
              className={`payment-option-btn ${paymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodChange('cod')}
            >
              <img src="/images/cash-on-delivery.svg" alt="Cash on Delivery" style={{height: 40, marginBottom: 6}} />
              <span>Cash on Delivery</span>
            </button>
          </div>
        </div>
        {paymentMethod === 'cod' && (
          <div className="cod-info modern-card">
            <span style={{color: '#0264f1', fontWeight: 600, fontSize: '1.08rem'}}>
              Pay with cash when your order is delivered. No online payment required.
            </span>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
      </section>
    </div>
  );
};

export default Checkout;
