import React from 'react';
import './OrderTable.css';

const OrderTable = ({ orders }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="order-table-container">
      <table className="order-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Seller</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.seller}</td>
              <td>{order.date}</td>
              <td>UGX {order.total.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td>{order.payment}</td>
              <td>
                <button className="action-btn view-btn">View</button>
                <button className="action-btn edit-btn">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
