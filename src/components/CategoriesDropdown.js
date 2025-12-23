import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaChevronRight, FaChevronDown, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { fetchCategories } from '../redux/categorySlice';
// import useCategoryCounts from '../hooks/useCategoryCounts';
import '../styles/CategoriesDropdown.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

const CategoriesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.categories || {});
  const categories = Array.isArray(items) ? items : [];
  // const { counts } = useCategoryCounts();
  const navigate = useNavigate();

  const getImageUrl = (product) => {
    if (!product) return null;
    let candidate = product.images?.[0] || product.imageUrl || product.image || product.photo || '';

    if (candidate && typeof candidate === 'object') {
      const objKeys = ['secure_url', 'url', 'src', 'link'];
      for (const k of objKeys) {
        if (typeof candidate[k] === 'string' && candidate[k].trim()) {
          candidate = candidate[k].trim();
          break;
        }
      }
    }

    if (typeof candidate !== 'string') return null;
    candidate = candidate.trim();
    if (!candidate) return null;
    if (candidate.startsWith('http')) return candidate;
    if (candidate.startsWith('//')) return `https:${candidate}`;
    if (candidate.startsWith('/')) return `${API_BASE_URL.replace('/api', '')}${candidate}`;
    if (candidate.startsWith('uploads')) return `${API_BASE_URL.replace('/api', '')}/${candidate}`;
    return `${API_BASE_URL.replace('/api', '')}/uploads/${candidate}`;
  };

  // NOTE: Categories on the left should NOT navigate. They only update the right panel.
  // Navigation happens from the right-side tiles ("subcategories/products") or explicit links.
  const navigateToProducts = (params = {}) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set('category', params.category);
    if (params.search) sp.set('search', params.search);
    const qs = sp.toString();
    closeDropdown();
    navigate(qs ? `/products?${qs}` : '/products');
  };

  const handleCategoryHover = async (categoryIndex, categoryName) => {
    setActiveCategory(categoryIndex);
    if (!categoryName || categoryName === 'All') {
      setCategoryProducts([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: {
          category: categoryName,
          limit: 18, // Show up to 18 products in the grid
          page: 1
        }
      });

      const products = response.data?.products || response.data?.data?.products || response.data || [];
      // Filter to only products that match the category exactly
      const filteredProducts = products.filter(p => 
        (p.category || '').toLowerCase() === categoryName.toLowerCase()
      ).slice(0, 18);
      
      setCategoryProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveCategory(null);
      setCategoryProducts([]);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveCategory(null);
    setCategoryProducts([]);
  };

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
                      onClick={() => handleCategoryHover(index, category.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCategoryHover(index, category.name);
                        }
                      }}
                    >
                      <div className="category-header">
                        {/* Render category.icon if provided, else fallback */}
                        {category.icon ? (
                          <span className="category-icon">{category.icon}</span>
                        ) : null}
                        <span className="category-name">{category.name}</span>
                        {activeCategory === index && (
                          <FaChevronRight className="chevron-icon" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Products panel for active category */}
                {activeCategory !== null && categories[activeCategory] && (
                  <div className="subcategories-panel">
                    <div className="category-panel-header">
                      <h2 className="category-panel-title">{categories[activeCategory].name}</h2>
                      <div className="category-panel-actions">
                        <Link 
                          to={`/products?category=${encodeURIComponent(categories[activeCategory].name)}`}
                          className="browse-link"
                          onClick={closeDropdown}
                        >
                          Browse featured selections
                                </Link>
                        <button 
                          className="close-panel-btn"
                          onClick={() => setActiveCategory(null)}
                          aria-label="Close panel"
                        >
                          <FaTimes />
                        </button>
                        </div>
                    </div>
                    
                    {loadingProducts ? (
                      <div className="category-products-loading">Loading products...</div>
                    ) : categoryProducts.length > 0 ? (
                      <div className="category-products-grid">
                        {categoryProducts.map((product, idx) => {
                          const imageUrl = getImageUrl(product);
                          const productName = product.name || product.category || 'Product';
                          return (
                            <div 
                              key={product._id || idx}
                              className="category-product-item"
                              onClick={() => {
                                const categoryName = categories[activeCategory]?.name;
                                const productName = product?.name || '';
                                // Clicking a tile should navigate and filter by product name (and category if available)
                                navigateToProducts({
                                  category: categoryName || undefined,
                                  search: productName || undefined,
                                });
                              }}
                            >
                              <div className="category-product-image-wrapper">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={productName}
                                    className="category-product-image"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="category-product-placeholder"
                                  style={{ display: imageUrl ? 'none' : 'flex' }}
                                >
                                  <span>{productName.charAt(0).toUpperCase()}</span>
                                </div>
                              </div>
                              <span className="category-product-label">{productName}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="category-products-empty">
                        No products found in this category
                      </div>
                    )}
                    
                    <div className="category-banner">
                      <h3>{categories[activeCategory].name}</h3>
                      <p>Explore our wide range of {categories[activeCategory].name && categories[activeCategory].name.toLowerCase()} products</p>
                      <Link 
                        to={`/products?category=${encodeURIComponent(categories[activeCategory].name)}`}
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
