import React from 'react';
import './OrderSkeleton.css';

const OrderSkeleton = ({ count = 5 }) => {
  // Create an array of skeletons with unique but stable keys
  const skeletons = Array.from({ length: count }, (_, index) => (
    <tr key={`skeleton-${index}`} className="order-skeleton-row">
      <td><div className="skeleton-cell skeleton-order-id"></div></td>
      <td><div className="skeleton-cell skeleton-buyer"></div></td>
      <td><div className="skeleton-cell skeleton-status"></div></td>
      <td><div className="skeleton-cell skeleton-date"></div></td>
      <td><div className="skeleton-cell skeleton-amount"></div></td>
      <td><div className="skeleton-cell skeleton-actions"></div></td>
    </tr>
  ));

  return (
    <table className="order-skeleton-table">
      <thead>
        <tr>
          <th>Order #</th>
          <th>Buyer</th>
          <th>Status</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {skeletons}
      </tbody>
    </table>
  );
};

export default OrderSkeleton;
