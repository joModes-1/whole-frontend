import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import OrderSkeleton from '../components/OrderSkeleton/OrderSkeleton';
import './BuyerOrdersPage.css';

const BuyerOrdersPage = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/buyer`,
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

  return (
    <div className="seller-orders-page">
      <div className="seller-orders-header">
        <h1>My Orders</h1>
      </div>
      
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
      
      {loading ? (
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
                  <td>${order.totalAmount.toFixed(2)}</td>
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
