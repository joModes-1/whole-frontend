import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../ProductCard/ProductCard';
import './SimilarProducts.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SimilarProducts = ({ categoryId, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    const fetchSimilarProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/products?category=${categoryId}`);
        // Filter out the current product and limit the results to 4
        let productsArr = Array.isArray(response.data) ? response.data : Array.isArray(response.data.data) ? response.data.data : [];
        if (!Array.isArray(productsArr)) {
          console.error('Unexpected similar products response:', response.data);
          productsArr = [];
        }
        const similar = productsArr.filter(p => p._id !== currentProductId).slice(0, 4);
        setProducts(similar);
      } catch (error) {
        console.error('Failed to fetch similar products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [categoryId, currentProductId]);

  if (loading) {
    return <div className="loading">Loading similar products...</div>;
  }

  if (products.length === 0) {
    return null; // Don't render the section if there are no similar products
  }

  return (
    <div className="similar-products-section">
      <h2>Similar Products</h2>
      <div className="similar-products-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default SimilarProducts;
