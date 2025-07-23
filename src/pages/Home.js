import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import HeroSection from '../components/HeroSection/HeroSection';
import ProductCard from '../components/ProductCard/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton/ProductSkeleton';
import { 
  FiSearch, 
  FiX, 
  FiTag, 
  FiBox, 
  FiFilter,
  FiDollarSign,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productsContainerRef = useRef(null);

  // Fetch all categories and products on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all products (or just categories endpoint if you have one)
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products?page=1&limit=1000`);
        const items = res.data?.data || res.data?.products || res.data?.items || [];
        setProducts(items);
        // Build category list from products
        const categoriesSet = new Set();
        items.forEach(product => {
          if (!product.category) return;
          if (typeof product.category === 'string') {
            categoriesSet.add(product.category.trim());
          } else if (Array.isArray(product.category)) {
            product.category.forEach(c => {
              if (typeof c === 'string') categoriesSet.add(c.trim());
              else if (typeof c === 'object' && c.name) categoriesSet.add(c.name.trim());
            });
          } else if (typeof product.category === 'object' && product.category.name) {
            categoriesSet.add(product.category.name.trim());
          }
        });
        setCategories(['All', ...Array.from(categoriesSet)]);
      } catch (err) {
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch products for selected category
  useEffect(() => {
    if (selectedCategory === 'All') return; // Already loaded on mount
    setLoading(true);
    setError(null);
    const fetchCategoryProducts = async () => {
      try {
        const params = new URLSearchParams();
        params.append('page', 1);
        params.append('limit', 1000);
        if (selectedCategory !== 'All') {
          params.append('selectedCategories[]', selectedCategory);
          params.append('category', selectedCategory);
        }
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products?${params.toString()}`);
        const items = res.data?.data || res.data?.products || res.data?.items || [];
        setProducts(items);
      } catch (err) {
        setError('Failed to load products for category.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Handler for category click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-layout">
          <aside className="sidebar">
            <div className="sidebar-skeleton">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="skeleton-filter"></div>
              ))}
            </div>
          </aside>
          <main className="content">
            <div className="hero-skeleton"></div>
            <section className="products-section">
              <h2 className="section-title">Recent Products</h2>
              <div className="products-grid">
                <ProductSkeleton count={8} />
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-content">
          <h2>Error Loading Products</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container" ref={productsContainerRef}>
      <div className="home-layout">
        <aside className="sidebar">
          <div className="filters-card">
            <div className="filters-header">
              <FiFilter className="filter-icon" />
              <h3>Filters</h3>
              <button className="reset-button">
                <FiRefreshCw className="reset-icon" />
                Reset
              </button>
            </div>

            <div className="search-filter">
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="search-input"
                />
                <button className="clear-search" aria-label="Clear search">
                  <FiX />
                </button>
              </div>
            </div>

            {/* Dynamic Categories Filter Section */}
            <div className="filter-section">
              <div className="filter-section-header">
                <FiTag className="section-icon" />
                <span>Categories</span>
              </div>
              <div className="filter-section-content">
                <div className="category-list">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`category-button${selectedCategory === cat ? ' active' : ''}`}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <span className="category-name">{cat}</span>
                      {selectedCategory === cat && <span className="selected-indicator"></span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="content">
          <HeroSection featuredProducts={products.slice(0, 10)} />
          
          <section className="products-section">
            <div className="section-header">
              <h2 className="section-title">
                {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                <span className="product-count">{products.length} products</span>
              </h2>
            </div>

            {loading ? (
              <div className="products-grid">
                <ProductSkeleton count={8} />
              </div>
            ) : products.length > 0 ? (
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-content">
                  <h3>No products found</h3>
                  <p>We couldn't find any products for this category.</p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;