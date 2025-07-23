import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';
import '../styles/CategoriesDropdown.css';






const CategoriesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Could not load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
            {loading && <div className="categories-loading">Loading categories...</div>}
            {error && <div className="categories-error">{error}</div>}
            {!loading && !error && (
              <>
                <div className="categories-list">
                  {categories.map((category, index) => (
                    <div 
                      key={category.id || index}
                      className={`category-item ${activeCategory === index ? 'active' : ''}`}
                      onMouseEnter={() => setActiveCategory(index)}
                    >
                      <div className="category-header">
                        {/* Render category.icon if provided, else fallback */}
                        {category.icon ? (
                          <span className="category-icon">{category.icon}</span>
                        ) : null}
                        <span className="category-name">{category.name}</span>
                        {category.subCategories && category.subCategories.length > 0 && (
                          <FaChevronRight className="chevron-icon" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {activeCategory !== null && categories[activeCategory] && categories[activeCategory].subCategories && (
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
