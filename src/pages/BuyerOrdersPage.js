import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import OrderSkeleton from '../components/OrderSkeleton/OrderSkeleton';
import './BuyerOrdersPage.css';

const BuyerOrdersPage = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await api.get('/orders/buyer', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        setOrders(response.data);
      } catch (err) {
        // Better error handling
        if (err.name === 'AbortError') {
          setError('Request timeout. Please try again.');
        } else if (err.response) {
          setError(err.response.data.message || `Error: ${err.response.status} - ${err.response.statusText}`);
        } else if (err.request) {
          setError('Network error. Please check your connection.');
        } else {
          setError(err.message || 'Failed to fetch orders');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const canCancel = (order) => {
    return order && ['pending', 'confirmed'].includes(order.status);
  };

  const handleCancel = async (orderId) => {
    if (!token) return;
    const confirmMsg = 'Are you sure you want to cancel this order?';
    if (!window.confirm(confirmMsg)) return;
    setCancelling((prev) => ({ ...prev, [orderId]: true }));
    try {
      await api.post(`/orders/${orderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update UI: mark status to cancelled locally
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o)));
      setSuccess('Order cancelled successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Persist a local notification for the buyer so it shows in Notifications
      try {
        const raw = localStorage.getItem('notifications');
        const arr = raw ? JSON.parse(raw) : [];
        const safeArr = Array.isArray(arr) ? arr : [];
        const now = new Date();
        safeArr.unshift({
          title: 'Order Cancelled',
          message: `Your order ${orderId} has been cancelled.`,
          date: now.toISOString().slice(0, 10),
          read: false,
        });
        localStorage.setItem('notifications', JSON.stringify(safeArr.slice(0, 50)));
      } catch (_) {
        // ignore localStorage errors
      }
    } catch (err) {
      alert(
        (err && err.response && err.response.data && err.response.data.message) ||
          'Failed to cancel order. Please try again.'
      );
    } finally {
      setCancelling((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-header">
        <h1>My Orders</h1>
      </div>
      {success && (
        <div className="success-message" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}
      
      <div className="buyer-info-card" style={{marginBottom: 24, padding: 16, background: '#f8f9fa', borderRadius: 8}}>
        <h3>Account Info</h3>
        {user ? (
          <ul style={{listStyle: 'none', padding: 0}}>
            <li><strong>Name:</strong> {user.name || 'N/A'}</li>
            <li><strong>Email:</strong> {user.email || 'N/A'}</li>
            <li><strong>Role:</strong> {user.role || 'N/A'}</li>
            <li><strong>Phone:</strong> {user.phoneNumber || 'N/A'}</li>
            {/* Add more fields if available */}
          </ul>
        ) : <div>No user info found.</div>}
      </div>
      
      {!token ? (
        <div className="orders-table-container">
          <div style={{marginTop: 32, fontWeight: 500, color: '#888', padding: '2rem', textAlign: 'center'}}>Please log in to view your orders.</div>
        </div>
      ) : loading ? (
        <OrderSkeleton count={5} />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : orders.length === 0 ? (
        <div className="orders-table-container">
          <div style={{marginTop: 32, fontWeight: 500, color: '#888', padding: '2rem', textAlign: 'center'}}>You have not placed any orders yet.</div>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Items</th>
                <th>Seller</th>
                <th>Status</th>
                <th>Date</th>
                <th>Amount</th>
                <th>QR Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    {order.items?.map((item, index) => (
                      <div key={index}>
                        {item.listing?.title || item.listing?.name || 'Product Name Not Available'} (Qty: {item.quantity})
                      </div>
                    ))}
                  </td>
                  <td>{order.seller?.email || 'N/A'}</td>
                  <td>{order.status}</td>
                  <td>{format(new Date(order.createdAt), 'PP')}</td>
                  <td>UGX {order.totalAmount.toFixed(2)}</td>
                  <td>
                    {/* QR Code Column */}
                    {order.status === 'delivered' ? (
                      <span style={{color: '#28a745', fontWeight: 'bold'}}>✅ Delivered</span>
                    ) : order.deliveryConfirmation && order.deliveryConfirmation.qrCode ? (
                      <div style={{textAlign: 'center'}}>
                        <img 
                          src={order.deliveryConfirmation.qrCode} 
                          alt="Delivery QR Code"
                          style={{
                            width: '60px', 
                            height: '60px', 
                            cursor: 'pointer',
                            border: '2px solid #e3f2fd',
                            borderRadius: '4px'
                          }}
                          onClick={() => {
                            // Open QR code in modal or new window
                            const newWindow = window.open('', '_blank', 'width=400,height=400');
                            newWindow.document.write(`
                              <html>
                                <head><title>Delivery QR Code - Order ${order.orderNumber}</title></head>
                                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:Arial,sans-serif;">
                                  <h3>Delivery QR Code</h3>
                                  <p>Order: ${order.orderNumber}</p>
                                  <img src="${order.deliveryConfirmation.qrCode}" style="max-width:300px;height:auto;" />
                                  <p style="text-align:center;margin-top:20px;color:#666;">Show this QR code to the delivery person</p>
                                </body>
                              </html>
                            `);
                          }}
                          title="Click to view full size QR code"
                        />
                        <div style={{fontSize: '0.8em', color: '#666', marginTop: '4px'}}>
                          Click to enlarge
                        </div>
                      </div>
                    ) : (
                      <button
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.8em',
                          background: '#ffc107',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={async () => {
                          try {
                            const { generateQRCode } = await import('../services/qrService');
                            const result = await generateQRCode(order._id);
                            if (result.success) {
                              // Update the order in state with new QR code
                              setOrders(prev => prev.map(o => 
                                o._id === order._id 
                                  ? {...o, deliveryConfirmation: result.deliveryConfirmation}
                                  : o
                              ));
                            }
                          } catch (error) {
                            console.error('QR generation failed:', error);
                            alert('Failed to generate QR code. Please try again.');
                          }
                        }}
                      >
                        Generate QR
                      </button>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      disabled={!canCancel(order) || cancelling[order._id]}
                      onClick={() => handleCancel(order._id)}
                      title={canCancel(order) ? 'Cancel this order' : 'Cannot cancel at this stage'}
                    >
                      {cancelling[order._id] ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BuyerOrdersPage;
