import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories } from '../redux/categorySlice';

const CategoryDropdown = ({ value, onChange, required = false }) => {
  const dispatch = useDispatch();
  const { items: categories, status } = useSelector((state) => state.categories);
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [status, dispatch]);
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSelect = (category) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  const filteredCategories = categories.filter(category => 
    category._id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="category-dropdown">
      <div className="dropdown-header" onClick={handleToggle}>
        <input 
          type="text" 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="Select or type a category"
          required={required}
          className="category-input"
        />
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="dropdown-list">
          <div className="dropdown-search">
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="dropdown-options">
            {status === 'loading' && <div>Loading categories...</div>}
            {status === 'failed' && <div>Error loading categories</div>}
            {status === 'succeeded' && filteredCategories.map((category) => (
              <div 
                key={category._id} 
                className="dropdown-option"
                onClick={() => handleSelect(category._id)}
              >
                {category._id}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
