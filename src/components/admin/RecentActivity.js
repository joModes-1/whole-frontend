import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import './RecentActivity.css';

const ICONS = {
  NEW_USER: 'fas fa-user-plus',
  NEW_ORDER: 'fas fa-shopping-cart',
  NEW_PRODUCT: 'fas fa-box',
};

const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="recent-activity-container">
        <h3>Recent Activity</h3>
        <p>No recent activity.</p>
      </div>
    );
  }

  const renderActivity = (activity) => {
    const { type, data, timestamp } = activity;
    const icon = ICONS[type] || 'fas fa-bell';

    let title = 'New Activity';
    let details = '';

    switch (type) {
      case 'NEW_USER':
        title = `New User: ${data.name}`;
        details = `Email: ${data.email}, Role: ${data.role}`;
        break;
      case 'NEW_ORDER':
        title = `New Order: #${data.orderNumber}`;
        details = `Buyer: ${data.buyer.name}, Total: $${data.totalAmount.toFixed(2)}`;
        break;
      case 'NEW_PRODUCT':
        title = `New Product: ${data.title}`;
        details = `Seller: ${data.vendor.name}`;
        break;
      default:
        break;
    }

    return (
      <li key={timestamp} className="activity-item">
        <div className="activity-icon">
          <i className={icon}></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">{title}</p>
          <p className="activity-details">{details}</p>
        </div>
        <div className="activity-time">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </div>
      </li>
    );
  };

  return (
    <div className="recent-activity-container">
      <h3>Recent Activity</h3>
      <ul className="activity-list">
        {activities.map(renderActivity)}
      </ul>
    </div>
  );
};

export default RecentActivity;
