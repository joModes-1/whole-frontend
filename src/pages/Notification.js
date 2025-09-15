import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './Notification.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const sampleNotifications = [
  {
    id: 1,
    title: 'Order Shipped',
    message: 'Your order #12345 has been shipped and is on its way!',
    date: '2025-07-05',
    read: false
  },
  {
    id: 2,
    title: 'Refund Processed',
    message: 'Your refund for order #12321 has been processed.',
    date: '2025-07-04',
    read: true
  },
  {
    id: 3,
    title: 'Welcome to Ujii!',
    message: 'Thanks for signing up. Enjoy shopping with us!',
    date: '2025-07-01',
    read: true
  }
];

const Notification = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    const fetchBuyerOrders = async () => {
      if (!token || !user) return;
      setLoadingOrders(true);
      setOrdersError('');
      try {
        const res = await api.get('/orders/buyer', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setOrdersError(
          err?.response?.data?.message || 'Failed to load your orders. Please try again.'
        );
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchBuyerOrders();
  }, [token, user]);

  // Load saved notifications from localStorage
  const savedNotifs = useMemo(() => {
    try {
      const raw = localStorage.getItem('notifications');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const allNotifications = [...savedNotifs, ...sampleNotifications];

  return (
    <div className="notification-page-container">
      <h2>Notifications</h2>
      <div className="notification-list">
        {allNotifications.length === 0 ? (
          <div className="notification-empty">No notifications yet.</div>
        ) : (
          allNotifications.map((notif, idx) => (
            <div key={notif.id || idx} className={`notification-item${notif.read ? ' read' : ''}`}>
              <div className="notification-title">{notif.title}</div>
              <div className="notification-message">{notif.message}</div>
              <div className="notification-date">{notif.date}</div>
            </div>
          ))
        )}
      </div>

      <div className="my-orders-panel">
        <div className="my-orders-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>My Orders</h3>
          <Link to="/orders" className="auth-link auth-link-primary">View All</Link>
        </div>
        {loadingOrders ? (
          <div className="notification-empty">Loading your orders...</div>
        ) : ordersError ? (
          <div className="notification-empty">{ordersError}</div>
        ) : !token ? (
          <div className="notification-empty">Please log in to view your orders.</div>
        ) : orders.length === 0 ? (
          <div className="notification-empty">You have no orders yet.</div>
        ) : (
          <div className="notification-list">
            {orders.slice(0, 3).map((order) => (
              <div key={order._id} className="notification-item">
                <div className="notification-title">
                  Order {order.orderNumber || order._id} • UGX {Number(order.totalAmount || 0).toLocaleString('en-UG')}
                </div>
                <div className="notification-message">
                  Status: {order.status}
                </div>
                <div className="notification-date">
                  {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
