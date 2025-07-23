import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const LiveProductSearch = ({ query, onSelect, onBlur }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.get(`/products?search=${encodeURIComponent(query.trim())}&limit=5`)
      .then(res => {
        setResults(res.data.data || []);
        setShowDropdown(true);
      })
      .catch(() => {
        setError('Error searching products.');
        setResults([]);
        setShowDropdown(true);
      })
      .finally(() => setLoading(false));
  }, [query]);

  // Hide dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        if (onBlur) onBlur();
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown, onBlur]);

  if (!showDropdown || (!loading && results.length === 0 && !error)) return null;

  return (
    <div className="live-search-dropdown" ref={dropdownRef}>
      {loading && <div className="live-search-loading">Searching...</div>}
      {error && <div className="live-search-error">{error}</div>}
      {!loading && results.length > 0 && (
        <ul className="live-search-list">
          {results.map(product => (
            <li key={product._id}>
              <Link
                to={`/products/${product._id}`}
                className="live-search-item"
                onClick={() => {
                  setShowDropdown(false);
                  if (onSelect) onSelect(product);
                }}
              >
                {product.name}
                {product.category && (
                  <span className="live-search-category">{product.category}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!loading && results.length === 0 && !error && (
        <div className="live-search-no-results">No products found.</div>
      )}
    </div>
  );
};

export default LiveProductSearch;
