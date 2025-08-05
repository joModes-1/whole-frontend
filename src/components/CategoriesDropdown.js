import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { fetchCategories } from '../redux/categorySlice';
import '../styles/CategoriesDropdown.css';






const CategoriesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.categories || {});
  const categories = Array.isArray(items) ? items : [];
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    closeDropdown();
    if (categoryName === 'All') {
      navigate('/products');
    } else {
      navigate(`/products?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [status, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="categories-dropdown-container" ref={dropdownRef}>
      <button 
        className="categories-toggle"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="hamburger-icon">☰</span>
        <span>All Categories</span>
        <FaChevronDown className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="categories-dropdown">
          <div className="categories-panel">
            {status === 'loading' && <div className="categories-loading">Loading categories...</div>}
            {status === 'failed' && <div className="categories-error">{error}</div>}
            {status === 'succeeded' && (
              <>
                <div className="categories-list">
                  {Array.isArray(categories) && categories.map((category, index) => (
                    <div 
                      key={category._id || index}
                      className={`category-item ${activeCategory === index ? 'active' : ''}`}
                      onMouseEnter={() => setActiveCategory(index)}
                      onClick={() => handleCategoryClick(category._id)}
                    >
                      <div className="category-header">
                        {/* Render category.icon if provided, else fallback */}
                        {category.icon ? (
                          <span className="category-icon">{category.icon}</span>
                        ) : null}
                        <span className="category-name">{category._id} ({category.count})</span>
                        {/* Sub-category logic can be re-added here if the API is extended */}
                        {false && (
                          <FaChevronRight className="chevron-icon" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Sub-category panel logic is disabled as the current API does not provide sub-categories */}
                {false && activeCategory !== null && categories[activeCategory] && (
                  <div className="subcategories-panel">
                    <div className="subcategories-grid">
                      {categories[activeCategory].subCategories.map((subCategory, subIndex) => (
                        <div key={subCategory.id || subIndex} className="subcategory-section">
                          <h4 className="subcategory-title">{subCategory.name}</h4>
                          <ul className="subcategory-items">
                            {subCategory.items.map((item, itemIndex) => (
                              <li key={item.id || itemIndex} className="subcategory-item">
                                <Link to={`/search?category=${encodeURIComponent(item.name || item)}`} onClick={closeDropdown}>
                                  {item.name || item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="category-banner">
                      <h3>{categories[activeCategory].name}</h3>
                      <p>Explore our wide range of {categories[activeCategory].name && categories[activeCategory].name.toLowerCase()} products</p>
                      <Link 
                        to={`/category/${categories[activeCategory].name && categories[activeCategory].name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="view-all-btn"
                        onClick={closeDropdown}
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesDropdown;
