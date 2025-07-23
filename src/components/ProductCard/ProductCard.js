import React, { useState, useEffect, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import { getProductImage, getPlaceholderImage } from '../../utils/imageUtils';
import 'react-toastify/dist/ReactToastify.css';
import './ProductCard.css';

const ProductCard = forwardRef(({ product }, ref) => {
  const { addToCart } = useCart();
  const [error, setError] = useState(null);
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
      setError(null);

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
      setError(err.message || 'Failed to add to cart');
      toast.error('Failed to add to cart', {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = product.stock === 0;

  return (
    <div className="product-card" ref={ref}>
      <Link to={`/products/${product._id}`} className="product-card-link" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="product-image-container">
          <img
            src={getProductImage(product)}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = getPlaceholderImage();
              setError('Failed to load product image');
            }}
          />
          {error && <div className="image-error">{error}</div>}
        </div>
        <div className="product-details">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-price">${product.price.toFixed(2)}</p>
          <p className="product-description">{product.description}</p>
          <p className="product-date">
            {product.createdAt ? 
              `Added: ${new Date(product.createdAt).toLocaleDateString()} at ${new Date(product.createdAt).toLocaleTimeString()}` 
              : 'No date available'}
          </p>
        </div>
      </Link>
      <div className="product-actions">
        <button
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          aria-label={isOutOfStock ? 'Out of stock' : 'Add to cart'}
          className={`add-to-cart-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <span>Adding...</span>
          ) : added ? (
            <span>✓ Added!</span>
          ) : isOutOfStock ? (
            <span>Out of Stock</span>
          ) : (
            <span>Add to Cart</span>
          )}
        </button>
      </div>
    </div>
  );
});

export default ProductCard; 