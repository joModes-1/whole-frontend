import React from 'react';
import './Skeleton.css';

const ProductCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line title"></div>
        <div className="skeleton-line price"></div>
        <div className="skeleton-line category"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
