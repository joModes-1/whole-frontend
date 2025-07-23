import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import './SellerOrdersPage.css';

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
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/buyer`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="seller-orders-page">
      <h1>My Orders</h1>
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
      {orders.length === 0 ? (
        <div style={{marginTop: 32, fontWeight: 500, color: '#888'}}>You have not placed any orders yet.</div>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>{order.seller?.email || 'N/A'}</td>
                <td>{order.status}</td>
                <td>{format(new Date(order.createdAt), 'PP')}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BuyerOrdersPage;
