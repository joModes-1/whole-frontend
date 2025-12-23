import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaBell, FaBox, FaCheckCircle, FaTruck, FaInfoCircle } from 'react-icons/fa';
import './Notification.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Helper to get notification icon based on type
const getNotificationIcon = (type) => {
  switch(type) {
    case 'welcome': return <FaBell className="notification-icon welcome" />;
    case 'order': return <FaBox className="notification-icon order" />;
    case 'shipping': return <FaTruck className="notification-icon shipping" />;
    case 'success': return <FaCheckCircle className="notification-icon success" />;
    default: return <FaInfoCircle className="notification-icon info" />;
  }
};

const Notification = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [notifications, setNotifications] = useState([]);

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
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const raw = localStorage.getItem('userNotifications');
        const parsed = raw ? JSON.parse(raw) : [];
        setNotifications(Array.isArray(parsed) ? parsed : []);
      } catch {
        setNotifications([]);
      }
    };
    loadNotifications();
  }, []);

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('userNotifications', JSON.stringify([]));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-page-container">
      <div className="notification-header">
        <h2>
          <FaBell className="header-icon" /> 
          Notifications
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h2>
        {notifications.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={clearAllNotifications}
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <FaBell className="empty-icon" />
            <p>No notifications yet</p>
            <span>You'll see new notifications here when you have them</span>
          </div>
        ) : (
          notifications.map((notif, idx) => (
            <div 
              key={notif.id || idx} 
              className={`notification-item${notif.read ? ' read' : ''}`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className="notification-content">
                {getNotificationIcon(notif.type)}
                <div className="notification-details">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-date">
                    {notif.date ? format(new Date(notif.date), 'MMM dd, yyyy h:mm a') : ''}
                  </div>
                </div>
              </div>
              {!notif.read && <span className="unread-dot"></span>}
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
