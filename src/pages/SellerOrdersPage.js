import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SellerOrdersPage.css';
import api from '../services/api';
import { format } from 'date-fns';
import OrderSkeleton from '../components/OrderSkeleton/OrderSkeleton';
import { FaSync } from 'react-icons/fa';

const SellerOrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState({});
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await api.get('/orders/seller', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle different response structures
        let ordersData = [];
        if (Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (response.data && Array.isArray(response.data.orders)) {
          ordersData = response.data.orders;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          ordersData = response.data.data;
        } else {
          console.warn('Unexpected response structure:', response.data);
          ordersData = [];
        }
        
        setOrders(ordersData);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timeout. Please try again.');
        } else if (err.response) {
          setError(err.response.data.message || `Error: ${err.response.status} - ${err.response.statusText}`);
        } else if (err.request) {
          setError('Network error. Please check your connection.');
        } else {
          setError(err.message || 'Failed to fetch orders');
        }
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [token]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleStatusChange = (orderId, value) => {
    setSelectedStatus(prev => ({ ...prev, [orderId]: value }));
  };

  const updateOrderStatus = async (orderId) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status: selectedStatus[orderId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, status: selectedStatus[orderId] }
          : order
      ));
      
      // Clear selection
      setSelectedStatus(prev => ({ ...prev, [orderId]: '' }));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const confirmDelivery = async (orderId) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status: 'delivered' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, status: 'delivered', deliveryConfirmation: { confirmedAt: new Date() } }
          : order
      ));
      
      alert('Delivery confirmed successfully!');
    } catch (err) {
      console.error('Error confirming delivery:', err);
      alert('Failed to confirm delivery');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const refreshOrders = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/orders/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle different response structures
      let ordersData = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else {
        console.warn('Unexpected response structure:', response.data);
        ordersData = [];
      }
      
      setOrders(ordersData);
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || `Error: ${err.response.status} - ${err.response.statusText}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Failed to fetch orders');
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      case 'shipped':
        return 'status-shipped';
      case 'processing':
        return 'status-processing';
      case 'pending':
        return 'status-processing';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-header">
        <h1 className="page-title">All Orders</h1>
        <button 
          className="btn-refresh" 
          onClick={refreshOrders} 
          disabled={loading}
          title="Refresh orders"
        >
          <FaSync className={loading ? 'spinning' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!token ? (
        <div className="dashboard-card-full">
          <div className="empty-state">
            <p>Please log in to view your orders.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="dashboard-card-full">
          <OrderSkeleton count={5} />
        </div>
      ) : orders.length === 0 ? (
        <div className="dashboard-card-full">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>You haven't received any orders yet. Keep promoting your products to get orders!</p>
          </div>
        </div>
      ) : (
        <div className="dashboard-section">
          <div className="dashboard-card-full">
            <table className="recent-orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Buyer</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber || order._id.slice(-8)}</td>
                    <td className="buyer-name">{order.buyer?.name || 'N/A'}</td>
                    <td>
                      <div className="status-controls">
                        <select 
                          value={selectedStatus[order._id] || order.status} 
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="order-status-select"
                          disabled={updating[order._id] || ['cancelled','delivered','refunded'].includes(order.status)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {order.status === 'processing' ? (
                          <button
                            className="btn btn-success"
                            disabled={updating[order._id]}
                            onClick={() => confirmDelivery(order._id)}
                          >
                            {updating[order._id] ? 'Confirming...' : 'Confirm Delivery'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary order-update-btn"
                            disabled={
                              updating[order._id] || 
                              (selectedStatus[order._id] || order.status) === order.status ||
                              ['cancelled','delivered','refunded'].includes(order.status)
                            }
                            onClick={() => updateOrderStatus(order._id)}
                          >
                            {updating[order._id] ? 'Updating...' : 'Update'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{format(new Date(order.createdAt), 'PP')}</td>
                    <td className="amount">{formatCurrency(order.totalAmount)}</td>
                    <td className="actions-cell">
                      <span className={`status-badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
