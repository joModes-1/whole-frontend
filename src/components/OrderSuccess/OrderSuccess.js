import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getOrderById } from '../../services/orderService';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Get order ID from URL params
        const params = new URLSearchParams(location.search);
        const orderId = params.get('order_id');

        if (!orderId) {
          throw new Error('No order ID found');
        }

        const orderData = await getOrderById(orderId);
        setOrder(orderData);
        // Cart should already be cleared after successful payment verification
        // Only clear cart here for COD orders or if it wasn't cleared elsewhere
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [clearCart, location.search]);

  if (loading) {
    return (
      <div className="order-success-container">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-success-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/orders')}>View Orders</button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-success-container">
        <div className="error-message">
          <h2>Order Not Found</h2>
          <p>The order you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/orders')}>View Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-message">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order has been received.</p>
      </div>

      <div className="order-details">
        <h2>Order Details</h2>
        <div className="order-info">
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span className={`status ${order.status}`}>{order.status}</span></p>
          <p><strong>Payment Status:</strong> <span className={`status ${order.isPaid ? 'paid' : 'pending'}`}>
            {order.isPaid ? 'Paid' : 'Pending'}
          </span></p>
        </div>

        <div className="shipping-info">
          <h3>Shipping Information</h3>
          <p><strong>Name:</strong> {order.shippingInfo?.name || ''}</p>
          <p><strong>Address:</strong> {order.shippingInfo?.address || ''}</p>
          <p><strong>City:</strong> {order.shippingInfo?.city || ''}</p>
          <p><strong>Country:</strong> {order.shippingInfo?.country || ''}</p>
          <p><strong>Phone:</strong> {order.shippingInfo?.phone || ''}</p>
        </div>

        <div className="order-items">
          <h3>Order Items</h3>
          {order.items.map((item) => (
            <div key={item._id} className="order-item">
              <img src={item.image} alt={item.name} />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ${item.price}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${order.totalAmount}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>${order.totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={() => navigate('/orders')}>View All Orders</button>
        <button onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    </div>
  );
};

export default OrderSuccess; 