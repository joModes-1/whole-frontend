import React from 'react';
import { Link } from 'react-router-dom';
import { getProductImage, getPlaceholderImage } from '../../utils/imageUtils';
import './TestProductCard.css';

const TestProductCard = ({ product }) => {
  const image = getProductImage(product) || getPlaceholderImage();
  const title = product?.name || product?.title || 'Untitled Product';
  const price = typeof product?.price === 'number' ? product.price : Number(product?.price) || 0;

  return (
    <div className="test-product-card">
      <div className="test-product-image" style={{ backgroundImage: `url(${image})` }} />
      <div className="test-product-info">
        <Link to={`/products/${product?._id || product?.id || ''}`} className="test-product-title-link">
          <h3 className="test-product-title">{title}</h3>
        </Link>
        <p className="test-product-price">${price.toFixed(2)}</p>
        <div className="test-button-container">
          <Link to={`/products/${product?._id || product?.id || ''}`} className="test-add-to-cart-btn">View</Link>
        </div>
      </div>
    </div>
  );
};

export default TestProductCard;
