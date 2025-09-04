import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SellerOrdersPage.css';
import axios from 'axios';
import { format } from 'date-fns';
import OrderSkeleton from '../components/OrderSkeleton/OrderSkeleton';

const SellerOrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState({});
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/seller`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }
        );
        
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

  const handleStatusChange = (orderId, status) => {
    setSelectedStatus({ ...selectedStatus, [orderId]: status });
  };

  const updateOrderStatus = async (orderId) => {
    setUpdating(u => ({ ...u, [orderId]: true }));
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/${orderId}/status`,
        { status: selectedStatus[orderId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refetch orders
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/seller`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(u => ({ ...u, [orderId]: false }));
    }
  };

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-header">
        <h1>All Orders</h1>
      </div>
      
      {loading ? (
        <OrderSkeleton count={5} />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Items</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Date</th>
                <th>Amount</th>
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
                  <td>{order.buyer?.name || 'Unknown'}</td>
                  <td>
                    <select 
                      value={selectedStatus[order._id] || order.status} 
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="order-status-select"
                      disabled={updating[order._id]}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      className="btn btn-primary order-update-btn"
                      style={{ marginLeft: 8 }}
                      disabled={updating[order._id] || (selectedStatus[order._id] || order.status) === order.status}
                      onClick={() => updateOrderStatus(order._id)}
                    >
                      {updating[order._id] ? 'Updating...' : 'Update'}
                    </button>
                  </td>
                  <td>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                  <td>UGX {order.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
