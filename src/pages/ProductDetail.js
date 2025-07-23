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
  const categoryId = product.category && (typeof product.category === 'object' ? product.category._id : product.category);

  return (
    <div className="product-detail-container modern-layout">
      {/* Main content row: left = product, right = seller */}
      <div className="product-detail-main side-by-side">
        {/* Left column: Product images and info */}
        <div className="product-main-content">
          <div className="product-image-gallery">
            <div className="main-image">
              <img src={mainImage || 'https://via.placeholder.com/800x600?text=No+Image'} alt={product.name} />
            </div>
          </div>

          <div className="product-info">
            <h1>{product.name}</h1>
            <p className="seller">By {product.seller?.companyName || 'Unknown Seller'}</p>
            <div className="price-section">
              <span className="price">${product.price.toFixed(2)}</span>
              {!inStock && <span className="out-of-stock">Out of Stock</span>}
            </div>
            <p className="description">{product.description}</p>
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="specifications">
                <h3>Specifications</h3>
                <table>
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="actions">
              {inStock ? (
                <>
                  <div className="quantity-selector">
                    <label htmlFor="quantity">Quantity:</label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={handleQuantityChange}
                    />
                  </div>
                  <button className="btn-primary" onClick={handleAddToCart}>
                    Add to Cart
                  </button>
                </>
              ) : (
                <button className="btn-secondary" onClick={handleQuoteRequest}>
                  Request Quote
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Right column: Seller info only */}
        <aside className="product-detail-side">
          <SellerInfoCard seller={product.seller} />
        </aside>
      </div>
      {/* Similar Products: below both columns, full width */}
      <div className="similar-products-section full-width">
        <h3 className="similar-title">More from this category</h3>
        <SimilarProducts categoryId={categoryId} currentProductId={product._id} />
      </div>
    </div>
  );
};

export default ProductDetail; 