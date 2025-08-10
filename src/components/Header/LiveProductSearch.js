import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const LiveProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchQuery = encodeURIComponent(searchTerm.trim());
      navigate(`/products?search=${searchQuery}`);
      // Don't clear the search term immediately - let the Products page handle it
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearchSubmit} className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for productss..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          <FaSearch />
        </button>
      </form>
    </div>
  );
};

export default LiveProductSearch;
