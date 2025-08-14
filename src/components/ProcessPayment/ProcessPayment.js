import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../../context/CartContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { createStripeSession, createPayPalOrder, capturePayPalPayment, initiatePesapal, verifyPesapal } from '../../services/paymentService';
import { getOrderById } from '../../services/orderService';
import './ProcessPayment.css';

const ProcessPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // UGX currency formatter
  const formatUGX = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return `UGX ${Math.round(amount || 0).toLocaleString('en-UG')}`;
    }
  }, []);

  // Get order/invoice ID and payment method from URL parameters
  // Also check for Pesapal callback parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('order_id') || searchParams.get('invoice_id');
    const method = searchParams.get('method');
    // Pesapal returns OrderTrackingId on callback
    const pesapalTrackingId = searchParams.get('OrderTrackingId');
    
    if (!id || !method) {
      navigate('/checkout');
      return;
    }
    
    setOrderId(id);
    setPaymentMethod(method);
    
    // Fetch order details
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        setOrder(orderData);
        
        // If this is a Pesapal callback, verify payment regardless of status (backend is source of truth)
        if (pesapalTrackingId) {
          try {
            const response = await verifyPesapal(id, pesapalTrackingId, method);
            if (response.success) {
              clearCart(); // Clear cart only after successful payment
              navigate(`/order-success?order_id=${id}`);
            }
          } catch (err) {
            console.error('Error verifying Pesapal payment:', err);
            setError('Payment verification failed. Please contact support.');
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Could not load order details. Please try again.');
        navigate('/checkout');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [location, navigate, clearCart]);

  // Handle Stripe payment
  const handleStripePayment = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Create Stripe session
      const sessionData = await createStripeSession(orderId, order.totalAmount, 'USD');
      
      // Redirect to Stripe checkout
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionData.sessionId
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      console.error('Stripe payment error:', err);
      setError(err.message || 'Error processing Stripe payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle PayPal payment
  const handlePayPalCreateOrder = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Create PayPal order
      const orderData = await createPayPalOrder(orderId, order.totalAmount);
      return orderData.orderId;
    } catch (err) {
      console.error('PayPal create order error:', err);
      setError(err.message || 'Error creating PayPal order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalApprove = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      // Capture PayPal payment
      await capturePayPalPayment(orderId, data.orderID);
      
      // Redirect to success page
      clearCart();
      navigate(`/order-success?order_id=${orderId}`);
    } catch (err) {
      console.error('PayPal capture error:', err);
      setError(err.message || 'Error capturing PayPal payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle Pesapal payment (also used for MTN/Airtel via Pesapal)
  const handlePesapalPayment = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Initialize Pesapal payment via backend
      const response = await initiatePesapal(
        orderId,
        order.totalAmount,
        order.buyer?.email || order?.buyer?.email,
        order.buyer?.name || order?.buyer?.name,
        order.buyer?.phone || order?.buyer?.phone,
        paymentMethod
      );

      if (response.paymentLink) {
        window.location.href = response.paymentLink; // Redirect to Pesapal hosted payment page
      } else {
        setError('Could not initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('Pesapal payment initiation error:', err);
      setError(err.message || 'Error initiating Pesapal payment');
    } finally {
      setLoading(false);
    }
  };

  // Render payment buttons based on selected method
  const renderPaymentButton = () => {
    if (!order) return null;
    
    switch (paymentMethod) {
      case 'stripe':
        return (
          <button 
            className="payment-button stripe-button" 
            onClick={handleStripePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Credit Card'}
          </button>
        );
        
      case 'paypal':
        return (
          <PayPalButtons
            createOrder={handlePayPalCreateOrder}
            onApprove={handlePayPalApprove}
            onError={(err) => {
              console.error('PayPal error:', err);
              setError('Error with PayPal payment');
            }}
          />
        );
        
      case 'pesapal':
        return (
          <button 
            className="payment-button flutterwave-button" 
            onClick={handlePesapalPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Pesapal'}
          </button>
        );
        
      case 'mtn':
        return (
          <button 
            className="payment-button mtn-button" 
            onClick={handlePesapalPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with MTN Mobile Money'}
          </button>
        );
        
      case 'airtel':
        return (
          <button 
            className="payment-button airtel-button" 
            onClick={handlePesapalPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Airtel Money'}
          </button>
        );
        
      default:
        return (
          <button 
            className="payment-button" 
            onClick={() => navigate('/checkout')}
          >
            Back to Checkout
          </button>
        );
    }
  };

  if (loading && !order) {
    return (
      <div className="process-payment-container">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="process-payment-container">
      <div className="process-payment-content">
        <h2>Process Payment</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {order && (
          <div className="payment-details">
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {order.items.map((item) => (
                  <div key={item._id} className="summary-item">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatUGX(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <span>{formatUGX(order.totalAmount)}</span>
              </div>
            </div>
            
            <div className="payment-section">
              <h3>Payment Method: {paymentMethod}</h3>
              <div className="payment-button-container">
                {renderPaymentButton()}
              </div>
            </div>
          </div>
        )}
        
        <button 
          className="back-button" 
          onClick={() => navigate('/checkout')}
        >
          Back to Checkout
        </button>
      </div>
    </div>
  );
};

export default ProcessPayment;
