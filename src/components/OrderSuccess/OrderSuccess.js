import React, { useEffect, useMemo, useState } from 'react';
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

  const IMAGES_BASE_URL = (process.env.REACT_APP_IMAGES_BASE_URL || 'http://localhost:4000/').replace(/\/$/, '/');

  const formatUGX = useMemo(() => (amount) => {
    const n = Number(amount || 0);
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(n);
    } catch {
      return `UGX ${Math.round(n).toLocaleString('en-UG')}`;
    }
  }, []);

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
          {(() => {
            const addr = order.shippingAddress || order.shippingInfo || {};
            const fullName = addr.fullName || order.buyer?.name || '';
            const addressLine = addr.street || addr.address || '';
            const district = addr.district || '';
            const subCounty = addr.subCounty || addr.subcounty || '';
            const phone = addr.phone || order.buyer?.phoneNumber || '';
            return (
              <>
                <p><strong>Name:</strong> {fullName}</p>
                <p><strong>Address:</strong> {addressLine}</p>
                {district ? <p><strong>District:</strong> {district}</p> : null}
                {subCounty ? <p><strong>Sub County:</strong> {subCounty}</p> : null}
                {phone ? <p><strong>Phone:</strong> {phone}</p> : null}
              </>
            );
          })()}
        </div>

        <div className="order-items">
          <h3>Order Items</h3>
          {order.items.map((item) => {
            const listing = item.listing || {};
            const name = listing.title || listing.name || item.name || 'Product Name Not Available';
            const unitPrice = item.unitPrice != null ? item.unitPrice : (item.price != null ? item.price : listing.price || 0);
            // Resolve image: prefer item.images then listing.images then item.image/listing.mainImage/listing.image
            let candidate = null;
            if (Array.isArray(item.images) && item.images.length > 0) {
              const f = item.images[0];
              candidate = typeof f === 'string' ? f : (f?.secure_url || f?.url || f?.path || null);
            }
            if (!candidate && Array.isArray(listing.images) && listing.images.length > 0) {
              const first = listing.images[0];
              candidate = typeof first === 'string' ? first : (first?.secure_url || first?.url || first?.path || null);
            }
            if (!candidate) candidate = item.image || listing.mainImage || listing.image || listing.thumbnail || null;
            let imageUrl = '/placeholder-image.svg';
            if (candidate) {
              if (typeof candidate === 'string' && (candidate.startsWith('http://') || candidate.startsWith('https://'))) {
                imageUrl = candidate;
              } else if (typeof candidate === 'string') {
                imageUrl = `${IMAGES_BASE_URL}${candidate.replace(/^\//, '')}`;
              }
            }
            return (
              <div key={item._id} className="order-item">
                <img src={imageUrl} alt={name} onError={(e)=>{ e.currentTarget.src = '/placeholder-image.svg'; }} />
                <div className="item-details">
                  <h4>{name}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: {formatUGX(unitPrice)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>{formatUGX(order.subtotal ?? order.totalAmount)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>{order.shippingCost ? formatUGX(order.shippingCost) : 'Free'}</span>
          </div>
          {order.tax != null && (
            <div className="summary-row">
              <span>Tax:</span>
              <span>{formatUGX(order.tax)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total:</span>
            <span>{formatUGX(order.totalAmount)}</span>
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