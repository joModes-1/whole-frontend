import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import { getProductImage, getPlaceholderImage } from '../../utils/imageUtils';
import 'react-toastify/dist/ReactToastify.css';
import './ProductCard.css';

const ProductCard = forwardRef(({ product }, ref) => {
  const { addToCart } = useCart();

  const formatUGX = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(amount) || 0);
    } catch {
      return `UGX ${Math.round(Number(amount) || 0).toLocaleString('en-UG')}`;
    }
  }, []);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let timer;
    if (added) {
      timer = setTimeout(() => setAdded(false), 2000);
    }
    return () => clearTimeout(timer);
  }, [added]);

  const handleAddToCart = async () => {
    if (loading) return;

    try {
      setLoading(true);

      // Validate product data
      if (!product || !product._id || !product.name || !product.price) {
        throw new Error('Invalid product data');
      }

      // Prepare cart item with all required fields
      const cartItem = {
        _id: product._id,
        name: product.name,
        price: Number(product.price),
        description: product.description || '',
        images: Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : [{ url: 'https://via.placeholder.com/300?text=No+Image' }],
        quantity: 1,
        seller: product.seller || {
          _id: 'default-seller',
          name: 'Unknown Seller',
          companyName: 'Unknown Seller'
        },
        stock: typeof product.stock === 'number' ? product.stock : 0
      };

      await addToCart(cartItem);
      setAdded(true);
      toast.success(`${product.name} added to cart!`, {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart', {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = product.stock === 0;

  const imageUrl = getProductImage(product) || getPlaceholderImage();

  return (
    <Link to={`/products/${product._id}`} className="productCard" ref={ref}>
      {/* Image section */}
      <div
        className="productCard-image"
        role="img"
        aria-label={product.name}
      >
        <img src={imageUrl} alt={product.name} className="productCard-img" />
        {product.isHotDeal && (
          <div className="hot-deal-badge">HOT DEAL</div>
        )}
      </div>

      {/* Info section */}
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        
        {/* Product details */}
        <div className="product-details">
          <p className="product-seller">
          </p>
          {product.district && (
            <p className="product-location">
              Location: {product.district}
            </p>
          )}
          <p className="product-stock">
            {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock})`}
          </p>
        </div>
        
        {/* Price section with hot deals support */}
        <div className="product-price-section">
          {product.isHotDeal && product.originalPrice ? (
            <div className="hot-deal-price">
              <span className="original-price">{formatUGX(product.originalPrice)}</span>
              <span className="current-price">{formatUGX(product.price)}</span>
              <span className="discount-badge">-{product.discountPercentage}%</span>
            </div>
          ) : (
            <p className="product-price">{formatUGX(product.price)}</p>
          )}
        </div>
        <div className="button-container">
          <button
            className={`add-to-cart-btn ${isOutOfStock ? 'out-of-stock' : ''}`}
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(); }}
            disabled={loading || isOutOfStock}
            aria-label={isOutOfStock ? 'Out of stock' : 'Add to cart'}
          >
            {loading ? 'Adding...' : isOutOfStock ? 'Out of Stock' : added ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
});

export default ProductCard; 