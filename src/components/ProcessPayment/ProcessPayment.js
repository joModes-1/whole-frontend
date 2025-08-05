import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../../context/CartContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { createStripeSession, createPayPalOrder, capturePayPalPayment, initiateFlutterwave, verifyFlutterwave } from '../../services/paymentService';
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

  // Get order/invoice ID and payment method from URL parameters
  // Also check for Flutterwave callback parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('order_id') || searchParams.get('invoice_id');
    const method = searchParams.get('method');
    const transactionId = searchParams.get('transaction_id');
    const status = searchParams.get('status');
    
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
        
        // If this is a Flutterwave callback with a successful status, verify payment
        if (transactionId && status === 'successful') {
          try {
            const response = await verifyFlutterwave(id, transactionId);
            if (response.success) {
              clearCart(); // Clear cart only after successful payment
              navigate(`/order-success?order_id=${id}`);
            }
          } catch (err) {
            console.error('Error verifying Flutterwave payment:', err);
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

  // Handle Flutterwave payment
  const handleFlutterwavePayment = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Initiate Flutterwave payment with the correct payment method
      const paymentData = await initiateFlutterwave(
        orderId,
        order.totalAmount,
        user?.email || '',
        user?.name || '',
        order.shippingInfo?.phone || user?.phone || '',
        paymentMethod // Pass the actual payment method (mtn, airtel, or flutterwave)
      );
      
      // Redirect to Flutterwave payment page
      if (paymentData.paymentLink) {
        window.location.href = paymentData.paymentLink;
      } else {
        setError('Could not initiate Flutterwave payment');
      }
    } catch (err) {
      console.error('Flutterwave payment error:', err);
      setError(err.message || 'Error processing Flutterwave payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment verification for Flutterwave
  useEffect(() => {
    const verifyFlutterwavePayment = async () => {
      const searchParams = new URLSearchParams(location.search);
      const transactionId = searchParams.get('transaction_id');
      
      if (transactionId && paymentMethod === 'flutterwave') {
        try {
          setLoading(true);
          setError('');
          
          // Verify payment
          const verification = await verifyFlutterwave(orderId, transactionId);
          
          if (verification.success) {
            // Redirect to success page
            clearCart();
            navigate(`/order-success?order_id=${orderId}`);
          } else {
            setError('Payment verification failed');
          }
        } catch (err) {
          console.error('Flutterwave verification error:', err);
          setError(err.message || 'Error verifying Flutterwave payment');
        } finally {
          setLoading(false);
        }
      }
    };
    
    verifyFlutterwavePayment();
  }, [location, paymentMethod, orderId, clearCart, navigate]);

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
        
      case 'flutterwave':
        return (
          <button 
            className="payment-button flutterwave-button" 
            onClick={handleFlutterwavePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with Flutterwave'}
          </button>
        );
        
      case 'mtn':
        return (
          <button 
            className="payment-button mtn-button" 
            onClick={handleFlutterwavePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay with MTN Mobile Money'}
          </button>
        );
        
      case 'airtel':
        return (
          <button 
            className="payment-button airtel-button" 
            onClick={handleFlutterwavePayment}
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
                    <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
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
