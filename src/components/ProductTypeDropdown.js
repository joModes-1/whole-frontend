import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './ProductTypeDropdown.css';

const ProductTypeDropdown = ({ value, onChange, required = false, selectedCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { items: categories } = useSelector((state) => state.categories);
  
  // Get subcategories for the selected category
  const getSubcategories = () => {
    if (!selectedCategory) return [];
    
    const category = categories.find(cat => cat.name === selectedCategory);
    if (!category || !category.subcategories) return [];
    
    // Handle both string and object subcategories
    return category.subcategories.map(sub => 
      typeof sub === 'string' ? sub : (sub.name || sub._id || sub.toString())
    );
  };

  const subcategories = getSubcategories();
  
  const filteredTypes = subcategories.filter(type => 
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
            {!selectedCategory && (
              <div className="dropdown-message">Please select a category first</div>
            )}
            {selectedCategory && filteredTypes.length === 0 && (
              <div className="dropdown-message">No subcategories available for this category</div>
            )}
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
