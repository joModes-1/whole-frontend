import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/orderService';
import api from '../../services/api';
import { loadStripe } from '@stripe/stripe-js';
import './Checkout.css';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace('/api', '');

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const { token, user } = useAuth();

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
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
          zipCode: user?.address?.zipCode || '',
          country: user?.address?.country || '',
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
        shippingInfo,
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

      clearCart();
      navigate(`/order-success?order_id=${newOrder._id}`);

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
              <label htmlFor="city">City</label>
              <input type="text" id="city" name="city" value={shippingInfo.city} onChange={handleShippingChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={shippingInfo.phone} onChange={handleShippingChange} required />
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
