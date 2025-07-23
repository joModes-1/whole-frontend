import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SellerOrdersPage.css';
import axios from 'axios';
import { format } from 'date-fns';

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
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/seller`,
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
      <h1>All Orders</h1>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Buyer</th>
            <th>Status</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td data-label="Order #">{order.orderNumber}</td>
              <td data-label="Buyer">{order.buyer.email || 'N/A'}</td>
              <td data-label="Status">
                {order.status}
                <div style={{ marginTop: 4 }}>
                  <select
                    className="order-status-select"
                    value={selectedStatus[order._id] || order.status}
                    onChange={e => setSelectedStatus({ ...selectedStatus, [order._id]: e.target.value })}
                    disabled={updating[order._id]}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <button
                    className="btn btn-primary order-update-btn"
                    style={{ marginLeft: 8 }}
                    disabled={updating[order._id] || (selectedStatus[order._id] || order.status) === order.status}
                    onClick={async () => {
                      setUpdating(u => ({ ...u, [order._id]: true }));
                      try {
                        await axios.patch(
                          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/orders/${order._id}/status`,
                          { status: selectedStatus[order._id] },
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
                        setUpdating(u => ({ ...u, [order._id]: false }));
                      }
                    }}
                  >
                    {updating[order._id] ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </td>
              <td data-label="Date">{format(new Date(order.createdAt), 'PP')}</td>
              <td data-label="Amount">${order.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerOrdersPage;
