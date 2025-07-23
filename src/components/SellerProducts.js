import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SellerProducts.css'; // Corrected CSS import path
import ProductCard from './ProductCard/ProductCard';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SellerProducts = () => { // Renamed component
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();


  const handleAddProduct = () => {
    navigate('/seller/add-product');
  };

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth context to finish loading
    }

    const fetchProducts = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error('Failed to get authentication token');
        }

        // Changed API endpoint
        const response = await axios.get(`${API_BASE_URL}/products/seller/my-products`, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });

        setProducts(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || 'Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'seller') { // Changed role check
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user || user.role !== 'seller') { // Changed role check
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Changed text */}
        <div className="text-xl">You must be a seller to access this page.</div>
      </div>
    );
  }

  return (
    <div className="seller-products"> {/* Changed class name */}
      <div className="seller-products-header"> {/* Changed class name */}
        <h1>My Products</h1>
      </div>

      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">
            <p>You haven't added any products yet.</p>
                        <button onClick={handleAddProduct} className="add-product-btn">Add Your First Product</button>
          </div>
        ) : (
          products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default SellerProducts; // Renamed default export
