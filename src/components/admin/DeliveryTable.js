import React from 'react';
import './DeliveryTable.css';

const DeliveryTable = ({ deliveries }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'in transit':
        return 'status-in-transit';
      case 'out for delivery':
        return 'status-out-for-delivery';
      case 'delivered':
        return 'status-delivered';
      case 'delayed':
        return 'status-delayed';
      case 'returned':
        return 'status-returned';
      default:
        return '';
    }
  };

  return (
    <div className="delivery-table-container">
      <table className="delivery-table">
        <thead>
          <tr>
            <th>Delivery ID</th>
            <th>Order ID</th>
            <th>Agent</th>
            <th>Status</th>
            <th>Location</th>
            <th>Last Update</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>{delivery.id}</td>
              <td>{delivery.orderId}</td>
              <td>{delivery.agent}</td>
              <td>
                <span className={`status-badge ${getStatusClass(delivery.status)}`}>
                  {delivery.status}
                </span>
              </td>
              <td>{delivery.location}</td>
              <td>{delivery.lastUpdate}</td>
              <td>
                <button className="action-btn track-btn">Track</button>
                <button className="action-btn details-btn">Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveryTable;
