import React, { useState } from 'react';
import './ConditionDropdown.css';

const ConditionDropdown = ({ value, onChange, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Common product conditions
  const conditions = [
    'New',
    'Used - Like New',
    'Used - Good',
    'Used - Fair',
    'Refurbished',
    'Open Box',
    'Damaged',
    'For Parts'
  ];

  const filteredConditions = conditions.filter(condition => 
    condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (condition) => {
    onChange(condition);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // If user types something that matches a condition, we could auto-select it
    // But we'll leave it as a text input to allow custom values
  };

  return (
    <div className="condition-dropdown">
      <div className="dropdown-header" onClick={handleToggle}>
        <input 
          type="text" 
          value={value || ''} 
          onChange={handleInputChange}
          placeholder="Select or type condition"
          required={required}
          className="condition-input"
        />
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="dropdown-list">
          <div className="dropdown-search">
            <input 
              type="text" 
              placeholder="Search conditions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="dropdown-options">
            {filteredConditions.map((condition) => (
              <div 
                key={condition} 
                className="dropdown-option"
                onClick={() => handleSelect(condition)}
              >
                {condition}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionDropdown;
