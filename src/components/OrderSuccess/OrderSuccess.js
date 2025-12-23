import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getOrderById } from '../../services/orderService';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrDownloaded, setQrDownloaded] = useState(false);
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
        
        // Auto-download QR code if available
        if (orderData.deliveryConfirmation?.qrCode) {
          autoDownloadQRCode(orderData);
        }
        
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

  const autoDownloadQRCode = (orderData) => {
    try {
      // Check if already downloaded in this session
      const downloadedKey = `qr-downloaded-${orderData._id}`;
      if (sessionStorage.getItem(downloadedKey)) {
        setQrDownloaded(true);
        return;
      }

      // Create a downloadable link from the QR code data URL
      const link = document.createElement('a');
      link.download = `order-${orderData.orderNumber}-qr.png`;
      link.href = orderData.deliveryConfirmation.qrCode;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Mark as downloaded
      sessionStorage.setItem(downloadedKey, 'true');
      setQrDownloaded(true);
    } catch (error) {
      console.error('Failed to auto-download QR code:', error);
    }
  };

  const manualDownloadQRCode = () => {
    if (order?.deliveryConfirmation?.qrCode) {
      const link = document.createElement('a');
      link.download = `order-${order.orderNumber}-qr.png`;
      link.href = order.deliveryConfirmation.qrCode;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  const isPaymentConfirmed = (order.status && String(order.status).toLowerCase() === 'confirmed') || order.isPaid === true || (order.paymentDetails && String(order.paymentDetails.paymentStatus).toLowerCase() === 'confirmed');
  const isCOD = order.paymentMethod && String(order.paymentMethod).toLowerCase() === 'cod';

  return (
    <div className="order-success-container">
      {isPaymentConfirmed || isCOD ? (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h1>{isCOD ? 'Order Successful!' : 'Payment Successful!'}</h1>
          <p>{isCOD ? 'Thank you for your order! Payment will be collected upon delivery.' : 'Thank you for your purchase. Your order has been received and payment confirmed.'}</p>
        </div>
      ) : (
        <div className="pending-message">
          <div className="success-icon" style={{background:'#fff3cd', color:'#856404'}}>⧗</div>
          <h1>Payment Pending</h1>
          <p>Your order was created and is awaiting mobile money authorization. If you already approved it on your phone, this page will update once confirmed.</p>
        </div>
      )}
      <div className="order-details">
        <h2>Order Details</h2>
        <div className="order-info">
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span className={`status ${order.status}`}>{order.status}</span></p>
          <p><strong>Payment Status:</strong> <span className={`status ${isPaymentConfirmed || isCOD ? 'paid' : 'pending'}`}>
            {isCOD ? 'Cash on Delivery' : (isPaymentConfirmed ? 'Paid' : 'Pending')}
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
            <span>Delivery Fee:</span>
            <span>{order.shippingCost ? formatUGX(order.shippingCost) : formatUGX(5000)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>{formatUGX(order.totalAmount)}</span>
          </div>
        </div>
        <div className="order-details">
          <div className="detail-row">
            <span className="label">Order Number:</span>
            <span className="value">{order.orderNumber}</span>
          </div>
          {/* Debug: Log order data */}
          {console.log('Order data:', order)}
          {console.log('Delivery confirmation:', order.deliveryConfirmation)}
          
          {/* QR Code for Delivery Confirmation */}
          {order.deliveryConfirmation && order.deliveryConfirmation.qrCode && order.status !== 'delivered' && (
            <div className="qr-code-section">
              <h3>Delivery Confirmation QR Code</h3>
              {qrDownloaded && (
                <div className="qr-download-notice">
                  ✓ QR code has been automatically downloaded to your device
                </div>
              )}
              <p className="qr-description">
                Show this QR code to the delivery person when your order arrives. 
                They will scan it to confirm delivery.
              </p>
              <div className="qr-code-container">
                <img 
                  src={order.deliveryConfirmation.qrCode} 
                  alt="Delivery Confirmation QR Code"
                  className="qr-code-image"
                />
              </div>
              <button 
                className="btn-download-qr"
                onClick={manualDownloadQRCode}
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  background: '#0264f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Download QR Code Again
              </button>
              <p className="qr-note">
                <strong>Note:</strong> Keep this QR code accessible (even offline) until your order is delivered.
              </p>
            </div>
          )}
          
          {/* Fallback message if QR code is missing */}
          {(!order.deliveryConfirmation || !order.deliveryConfirmation.qrCode) && order.status !== 'delivered' && (
            <div className="qr-code-section" style={{background: '#fff3cd', borderColor: '#ffeaa7'}}>
              <h3>⚠️ QR Code Generation Pending</h3>
              <p className="qr-description">
                Your delivery QR code is being generated. Click the button below to generate it now.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const { generateQRCode } = await import('../../services/qrService');
                    const result = await generateQRCode(order._id);
                    if (result.success) {
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('QR generation failed:', error);
                    alert('Failed to generate QR code. Please try refreshing the page.');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '0.5rem'
                }}
              >
                Generate QR Code
              </button>
              <button onClick={() => window.location.reload()} style={{
                padding: '0.5rem 1rem',
                background: '#ffc107',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Refresh Page
              </button>
            </div>
          )}
          {order.status === 'delivered' && order.deliveryConfirmation && order.deliveryConfirmation.confirmedAt && (
            <div className="delivery-confirmed">
              <h3>✅ Delivery Confirmed</h3>
              <p>Delivered on: {new Date(order.deliveryConfirmation.confirmedAt).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button onClick={() => navigate('/orders')}>View All Orders</button>
        <button onClick={() => {
          // Navigate to products page with all filters cleared
          navigate('/products');
          // Clear any search params from the URL
          window.history.replaceState({}, '', '/products');
        }}>Continue Shopping</button>
      </div>
    </div>
  );
};

export default OrderSuccess; 