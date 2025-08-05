import React from 'react';
import './OrderSkeleton.css';

const OrderSkeleton = ({ count = 5 }) => {
  // Create an array of skeletons with unique but stable keys
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={`skeleton-${index}`} className="order-skeleton-row">
      <div className="skeleton-cell skeleton-order-id"></div>
      <div className="skeleton-cell skeleton-buyer"></div>
      <div className="skeleton-cell skeleton-status"></div>
      <div className="skeleton-cell skeleton-date"></div>
      <div className="skeleton-cell skeleton-amount"></div>
    </div>
  ));

  return (
    <div className="order-skeleton-container">
      {skeletons}
    </div>
  );
};

export default OrderSkeleton;
