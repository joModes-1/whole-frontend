import React from 'react';
import './Notification.css';

const notifications = [
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
  return (
    <div className="notification-page-container">
      <h2>Notifications</h2>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">No notifications yet.</div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`notification-item${notif.read ? ' read' : ''}`}>
              <div className="notification-title">{notif.title}</div>
              <div className="notification-message">{notif.message}</div>
              <div className="notification-date">{notif.date}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;
