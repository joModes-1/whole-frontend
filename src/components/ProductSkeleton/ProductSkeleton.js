import React from 'react';
import './ProductSkeleton.css';

const ProductSkeleton = ({ count = 6 }) => {
  return (
    <div className="skeleton-grid">
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-image"></div>
          <div className="skeleton-line" style={{ width: '80%' }}></div>
          <div className="skeleton-line" style={{ width: '60%' }}></div>
          <div className="skeleton-line" style={{ width: '40%' }}></div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
