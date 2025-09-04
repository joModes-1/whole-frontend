import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './SearchResults.css';
import api from '../services/api';
import ProductCard from '../components/ProductCard/ProductCard.js';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    seller: '',
    inStock: false
  });

  useEffect(() => {
    const query = searchParams.get('q');
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}`);
        setResults(res.data.data || []);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    if (query) {
      fetchResults();
    }
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const query = searchParams.get('q')?.toLowerCase() || '';
  const filteredResults = results.filter(product => {
    // Strict search: name or description must include the query
    const name = product.name?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    if (query && !name.includes(query) && !description.includes(query)) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.seller && product.seller !== filters.seller) return false;
    if (filters.inStock && !product.inStock) return false;
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (product.price < min || (max && product.price > max)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="search-results-page">
      <div className="search-header">
        <h1>Search Results for "{searchParams.get('q')}"</h1>
        <p>{filteredResults.length} results found</p>
      </div>

      <div className="search-container">
        <aside className="filters-sidebar">
          <h2>Filters</h2>
          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Industrial">Industrial</option>
              <option value="Office Supplies">Office Supplies</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="priceRange">Price Range</label>
            <select
              id="priceRange"
              name="priceRange"
              value={filters.priceRange}
              onChange={handleFilterChange}
            >
              <option value="">All Prices</option>
              <option value="0-100">UGX 0 - UGX 100</option>
              <option value="100-500">UGX 100 - UGX 500</option>
              <option value="500-1000">UGX 500 - UGX 1000</option>
              <option value="1000-999999">UGX 1000+</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="seller">Seller</label>
            <select
              id="seller"
              name="seller"
              value={filters.seller}
              onChange={handleFilterChange}
            >
              <option value="">All Sellers</option>
              {Array.from(new Set(results.map(r => typeof r.seller === 'object' && r.seller ? r.seller.companyName || r.seller.name || 'Unknown Seller' : r.seller))).map(sellerName => (
                <option key={sellerName} value={sellerName}>{sellerName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="inStock"
                checked={filters.inStock}
                onChange={handleFilterChange}
              />
              In Stock Only
            </label>
          </div>
        </aside>

        <div className="results-grid">
          {filteredResults.map(product => (
            <ProductCard key={product._id || product.id || product.name} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults; 