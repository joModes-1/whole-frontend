import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../../context/CartContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { createStripeSession, createPayPalOrder, capturePayPalPayment, initiatePesapal, verifyPesapal } from '../../services/paymentService';
import { getOrderById } from '../../services/orderService';
import './ProcessPayment.css';

const ProcessPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');   
  // Refs to prevent duplicate polling in StrictMode and overlapping requests
  const pollStartedRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const verifyInFlightRef = useRef(false);

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
    
    // If this is a COD order, redirect directly to order success
    if (method === 'cod') {
      clearCart();
      navigate(`/order-success?order_id=${id}`);
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
            if (verifyInFlightRef.current) return; // avoid overlap
            verifyInFlightRef.current = true;
            const response = await verifyPesapal(id, pesapalTrackingId, method);
            if (response.success) {
              clearCart(); // Clear cart only after successful payment
              navigate(`/order-success?order_id=${id}`);
            }
            verifyInFlightRef.current = false;
          } catch (err) {
            console.error('Error verifying Pesapal payment:', err);
            setError('Payment verification failed. Please contact support.');
            verifyInFlightRef.current = false;
          }
        } else if (method === 'pesapal' || method === 'mtn' || method === 'airtel') {
          // No callback params present; user may have returned manually.
          // Try to poll using stored transactionRef from initiation.
          const storedRef = sessionStorage.getItem(`pesapal_tx_${id}`);
          if (storedRef) {
            if (!pollStartedRef.current) {
              pollStartedRef.current = true;
              let attempts = 0;
              const maxAttempts = 36; // ~3 minutes at 5s interval
              pollIntervalRef.current = setInterval(async () => {
                attempts += 1;
                try {
                  if (verifyInFlightRef.current) return; // prevent overlap
                  verifyInFlightRef.current = true;
                  const resp = await verifyPesapal(id, storedRef, method);
                  verifyInFlightRef.current = false;
                  if (resp && resp.success) {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    clearCart();
                    navigate(`/order-success?order_id=${id}`);
                  }
                } catch (e) {
                  verifyInFlightRef.current = false;
                  // Continue polling on transient errors
                  console.warn('Verify poll error:', e?.message || e);
                } finally {
                  if (attempts >= maxAttempts) {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                  }
                }
              }, 5000);
            }
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
    // Cleanup on unmount to avoid orphaned intervals
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [location.search, navigate, clearCart]);

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

      // Persist transaction reference for post-redirect verification polling
      if (response && response.transactionRef) {
        sessionStorage.setItem(`pesapal_tx_${orderId}`, response.transactionRef);
      }

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
