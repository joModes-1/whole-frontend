import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../ProductCard/ProductCard';
import './SimilarProducts.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SimilarProducts = ({ currentProductId, categoryId, limit = 30 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProductId && !categoryId) {
      setProducts([]);
      return;
    }

    const fetchSimilarProducts = async () => {
      setLoading(true);
      try {
        let response;
        
        // Try to fetch similar products by product ID first
        if (currentProductId) {
          try {
            response = await axios.get(`${API_BASE_URL}/products/${currentProductId}/similar`);
          } catch (error) {
            console.log('Similar products endpoint not available, falling back to category search');
          }
        }
        
        // If no similar products endpoint or it failed, fetch by category
        if (!response && categoryId) {
          response = await axios.get(`${API_BASE_URL}/products?category=${categoryId}&limit=${limit}`);
        }
        
        // If still no response, fetch general products
        if (!response) {
          response = await axios.get(`${API_BASE_URL}/products?limit=${limit}`);
        }

        const similar = response.data?.products || response.data || [];

        if (!Array.isArray(similar)) {
          console.error('Expected an array of similar products, but got:', similar);
          setProducts([]);
        } else {
          // Filter out the current product and limit results
          const filteredProducts = similar
            .filter(product => product._id !== currentProductId)
            .slice(0, limit);
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error('Failed to fetch similar products:', error);
        setProducts([]); // Clear products on error
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [currentProductId, categoryId, limit]);

  if (loading) {
    return <div className="loading">Loading similar products...</div>;
  }

  if (products.length === 0) {
    return null; // Don't render the section if there are no similar products
  }

  return (
    <div className="similar-products-section">
      <div className="similar-products-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
      {products.length === 0 && !loading && (
        <div className="no-products-message">
          <p>No similar products found at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default SimilarProducts;
