import React, { useState, useEffect } from 'react';
import ProductSkeleton from '../components/ProductSkeleton/ProductSkeleton';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';
import SimilarProducts from '../components/SimilarProducts/SimilarProducts';
import SellerInfoCard from '../components/SellerInfoCard';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[ProductDetail] API_BASE_URL:', API_BASE_URL);
        const fetchUrl = `${API_BASE_URL}/products/${id}`;
        console.log('[ProductDetail] Fetching product from:', fetchUrl);
        const response = await axios.get(fetchUrl);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setMainImage(response.data.images[0].url);
        }
      } catch (err) {
        setError('Failed to fetch product details. The product may not exist, the API URL may be wrong, or there was a network/CORS error. See console for details.');
        console.error('[ProductDetail] Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      // --- DEBUGGING SELLER INFO ---
      // The following lines will print the product data to your browser's developer console.
      // Press F12 in your browser and click the "Console" tab to see the output.
      console.log('--- Checking Product Data Before Adding to Cart ---');
      console.log('Full product object:', product);
      console.log('Seller field specifically:', product.seller);
      console.log('----------------------------------------------------');

      const itemToAdd = {
        ...product,
        quantity,
        image: mainImage, // Ensure the main image is passed to the cart
      };
      addToCart(itemToAdd);
      navigate('/cart');
    }
  };

  const handleQuoteRequest = () => {
    navigate('/rfq/new', { state: { product } });
  };

  if (loading) {
    return (
      <div className="product-detail-skeleton" style={{ maxWidth: 1000, margin: '32px auto' }}>
        <ProductSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return <div className="error">{error || 'Product not found'}</div>;
  }

  const inStock = product.stock > 0;
  // Handle both single and array categories. If it's an array, use the first category.
  const categoryId = product.category && (Array.isArray(product.category) ? product.category[0] : product.category);

  return (
    <div className="product-detail-container">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb">
        <span onClick={() => navigate('/')} className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span onClick={() => navigate('/products')} className="breadcrumb-link">Products</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="product-detail-main">
        {/* Left: Product Images and Details */}
        <div className="product-content">
          {/* Product Image Gallery */}
          <div className="product-image-section">
            <div className="main-image-container">
              <img 
                src={mainImage || 'https://via.placeholder.com/600x600?text=No+Image'} 
                alt={product.name}
                className="main-product-image"
              />
              {!inStock && <div className="stock-overlay">Out of Stock</div>}
            </div>
            
            {/* Thumbnail images if multiple images exist */}
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-gallery">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className={`thumbnail ${mainImage === image.url ? 'active' : ''}`}
                    onClick={() => setMainImage(image.url)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="product-info">
            <div className="product-header">
              <h1 className="product-title">{product.name}</h1>
              <div className="product-meta">
                <span className="product-category">{product.category?.name || 'Uncategorized'}</span>
                {product.productType && <span className="product-type">Type: {product.productType}</span>}
                {product.condition && <span className="product-condition">Condition: {product.condition}</span>}
                <span className="product-stock">Stock: {product.stock} units</span>
              </div>
            </div>

            <div className="price-section">
              <span className="current-price">UGX {product.price.toFixed(2)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="original-price">UGX {product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Product Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="specifications-section">
                <h3>Specifications</h3>
                <div className="specs-grid">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="spec-item">
                      <span className="spec-label">{key}:</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Actions */}
            <div className="purchase-section">
              {inStock ? (
                <div className="purchase-controls">
                  <div className="quantity-control">
                    <label>Quantity:</label>
                    <div className="quantity-input">
                      <button 
                        type="button" 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="qty-btn"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="qty-input"
                      />
                      <button 
                        type="button" 
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button className="btn-primary add-to-cart" onClick={handleAddToCart}>
                      Add to Cart - UGX {(product.price * quantity).toFixed(2)}
                    </button>
                    <button className="btn-secondary request-quote" onClick={handleQuoteRequest}>
                      Request Quote
                    </button>
                  </div>
                </div>
              ) : (
                <div className="out-of-stock-section">
                  <p className="stock-message">This item is currently out of stock</p>
                  <button className="btn-secondary" onClick={handleQuoteRequest}>
                    Request Quote for Restock
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Seller Information */}
        <aside className="seller-sidebar">
          <SellerInfoCard seller={product.seller} />
        </aside>
      </div>

      {/* Similar Products Section */}
      <section className="similar-products-wrapper">
        <div className="section-header">
          <h2>Similar Products</h2>
          <p>Discover more products like this one</p>
        </div>
        <SimilarProducts categoryId={categoryId} currentProductId={product._id} limit={30} />
      </section>
    </div>
  );
};

export default ProductDetail; 