import React, { useState } from 'react';
import './ProductTypeDropdown.css';

const ProductTypeDropdown = ({ value, onChange, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Common product types
  const productTypes = [
    'Physical Product',
    'Digital Product',
    'Service',
    'Subscription',
    'Bundle',
    'Custom Product'
  ];

  const filteredTypes = productTypes.filter(type => 
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (type) => {
    onChange(type);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // If user types something that matches a product type, we could auto-select it
    // But we'll leave it as a text input to allow custom values
  };

  return (
    <div className="product-type-dropdown">
      <div className="dropdown-header" onClick={handleToggle}>
        <input 
          type="text" 
          value={value || ''} 
          onChange={handleInputChange}
          placeholder="Select or type a product type"
          required={required}
          className="product-type-input"
        />
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="dropdown-list">
          <div className="dropdown-search">
            <input 
              type="text" 
              placeholder="Search product types..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="dropdown-options">
            {filteredTypes.map((type) => (
              <div 
                key={type} 
                className="dropdown-option"
                onClick={() => handleSelect(type)}
              >
                {type}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTypeDropdown;
