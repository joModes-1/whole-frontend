import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProducts,
  setFilters,
  setSearchTerm,
  selectAllProducts,
  resetProducts,
} from '../redux/productsSlice';
import ProductCard from '../components/ProductCard/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton/ProductSkeleton';
import { FaSearch, FaTags, FaBoxOpen, FaTimes } from 'react-icons/fa';
import './Products.css';
import useCategoryCounts from '../hooks/useCategoryCounts';
import BackToTopButton from '../components/BackToTopButton'; // ✅ Add this import if not already

const Products = () => {
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const status = useSelector(state => state.products.status);
  const error = useSelector(state => state.products.error);
  const hasMore = useSelector(state => state.products.hasMore);
  const reduxFiltersRaw = useSelector(state => state.products.filters);
  const reduxSearchTerm = useSelector(state => state.products.searchTerm);

  const observer = useRef();
  const lastProductElementRef = useCallback(node => {
    if (status === 'loading' || status === 'loadingMore') return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const nextPage = Math.ceil((allProducts.length || 0) / 20) + 1;
        console.log('Dispatching fetchProducts with nextPage:', nextPage);
        dispatch(fetchProducts(nextPage));
      }
    }, {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    });

    if (node) observer.current.observe(node);
  }, [status, hasMore, allProducts.length, dispatch]);

  const categories = useMemo(() => {
    const categoriesSet = new Set();
    allProducts.forEach(product => {
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
    const categoryArray = Array.from(categoriesSet);
    categoryArray.unshift('All');
    return categoryArray;
  }, [allProducts]);

  const selectedCategories = useMemo(() => {
    return Array.isArray(reduxFiltersRaw.selectedCategories) ? reduxFiltersRaw.selectedCategories : ['All'];
  }, [reduxFiltersRaw.selectedCategories]);

  const priceRange = useMemo(() => {
    return Array.isArray(reduxFiltersRaw.priceRange) ? reduxFiltersRaw.priceRange : [0, 10000];
  }, [reduxFiltersRaw.priceRange]);

  const availability = useMemo(() => {
    return Array.isArray(reduxFiltersRaw.availability) ? reduxFiltersRaw.availability : [];
  }, [reduxFiltersRaw.availability]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const name = (product.name || '').toString();
      const price = Number(product.price) || 0;
      const stock = Number(product.stock);
      let prodCategories = [];

      if (Array.isArray(product.category)) {
        prodCategories = product.category.map(c => (c || '').toString().toLowerCase().trim());
      } else if (typeof product.category === 'string') {
        prodCategories = [product.category.toLowerCase().trim()];
      } else if (typeof product.category === 'object' && product.category.name) {
        prodCategories = [product.category.name.toLowerCase().trim()];
      }

      if (reduxSearchTerm && !name.toLowerCase().includes(reduxSearchTerm.toLowerCase())) return false;

      if (selectedCategories[0] !== 'All') {
        const hasSelectedCategory = prodCategories.some(prodCat =>
          selectedCategories.some(selCat =>
            selCat.toLowerCase().trim() === prodCat.toLowerCase().trim()
          )
        );
        if (!hasSelectedCategory) return false;
      }

      if (priceRange[0] !== 0 || priceRange[1] !== 10000) {
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }

      if (availability.length > 0) {
        const inStock = stock > 0;
        const outOfStock = stock <= 0;
        const show = availability.some(option =>
          (option === 'in-stock' && inStock) ||
          (option === 'out-of-stock' && outOfStock)
        );
        if (!show) return false;
      }

      return true;
    });
  }, [allProducts, selectedCategories, priceRange, availability, reduxSearchTerm]);

  const { counts: categoryCounts, loading: loadingCounts } = useCategoryCounts();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const needsRefresh = params.get('refresh');
    if (needsRefresh) {
      dispatch(resetProducts());
      dispatch(fetchProducts(1));
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    if (status === 'idle' && allProducts.length === 0) {
      dispatch(fetchProducts(1));
    }
  }, [dispatch, status, allProducts.length]);

  const toggleCategory = (category) => {
    let updated = [];

    if (category === 'All') {
      updated = ['All'];
    } else {
      const prev = selectedCategories;
      const wasSelected = prev.includes(category);
      updated = wasSelected
        ? prev.filter(c => c !== category)
        : [...prev.filter(c => c !== 'All'), category];

      if (updated.length === 0) updated = ['All'];
    }

    dispatch(setFilters({ ...reduxFiltersRaw, selectedCategories: updated }));
  };

  const resetFilters = () => {
    dispatch(setSearchTerm(''));
    dispatch(setFilters({
      ...reduxFiltersRaw,
      priceRange: [0, 10000],
      selectedCategories: ['All'],
      availability: []
    }));
  };

  if (status === 'loading' || allProducts === null) {
    return (
      <>
        <div className="products-card-container">
          <div className="products-card-layout">
            <div className="filter-sidebar show"></div>
            <div className="recent-product-grid">
              <ProductSkeleton count={8} />
            </div>
          </div>
        </div>
        <BackToTopButton />
      </>
    );
  }

  if (status === 'failed') {
    return (
      <>
        <div className="error-container">
          <div className="error-message">
            {error || 'Failed to load products. Please try again later.'}
          </div>
        </div>
        <BackToTopButton />
      </>
    );
  }

  return (
    <>
      <div className="products-card-container">
        <div className="products-card-layout">
          {/* Left Sidebar */}
          <div className="filter-sidebar show">
            {/* Filter Header */}
            <div className="filter-header">
              <h2>Filters</h2>
              <button onClick={resetFilters} className="reset-filters">Reset All</button>
            </div>

            {/* Search */}
            <div className="search-section">
              <label className="search-label">Search</label>
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="search-input"
                  value={reduxSearchTerm}
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                />
                {reduxSearchTerm && (
                  <button onClick={() => dispatch(setSearchTerm(''))} className="clear-search">
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="filter-sections-container">
              {/* Categories */}
              <div className="filter-section">
                <div className="filter-header-content">
                  <FaTags className="filter-section-icon" />
                  Categories
                </div>
                <div className="filter-content">
                  <div className="category-header-bar">
                    <span className="selected-count">{selectedCategories.length} selected</span>
                    <button
                      className="clear-categories"
                      onClick={() => dispatch(setFilters({ ...reduxFiltersRaw, selectedCategories: ['All'] }))}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="category-list">
                    {categories.map((cat) => {
                      const catKey = typeof cat === 'object' ? cat.name : cat;
                      return (
                        <div key={catKey} className="category-item">
                          <input
                            id={`category-${catKey}`}
                            type="checkbox"
                            checked={selectedCategories.includes(catKey)}
                            onChange={() => toggleCategory(catKey)}
                            className="category-checkbox"
                          />
                          <label htmlFor={`category-${catKey}`} className="category-label-container">
                            <span className="category-name">{catKey}</span>
                            <span className="category-count-badge">
                              {loadingCounts ? '...' : (
                                catKey === 'All'
                                  ? categories.filter(c => c !== 'All').reduce((sum, c) => {
                                      const cName = typeof c === 'object' ? c.name : c;
                                      return sum + (categoryCounts[cName] || 0);
                                    }, 0)
                                  : categoryCounts[catKey] || 0
                              )}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <div className="filter-header-content">
                  <FaTags className="filter-section-icon" />
                  Price Range
                </div>
                <div className="filter-content">
                  <div className="price-range-values">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceRange[1]}
                    onChange={(e) =>
                      dispatch(setFilters({ ...reduxFiltersRaw, priceRange: [priceRange[0], parseInt(e.target.value)] }))
                    }
                    className="price-range-slider"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="filter-section">
                <div className="filter-header-content">
                  <FaBoxOpen className="filter-section-icon" />
                  Availability
                </div>
                <div className="filter-content">
                  <div className="availability-options">
                    {['in-stock', 'out-of-stock'].map(option => (
                      <div key={option} className="availability-option">
                        <input
                          id={`availability-${option}`}
                          type="checkbox"
                          checked={availability.includes(option)}
                          onChange={() => dispatch(setFilters({
                            ...reduxFiltersRaw,
                            availability: availability.includes(option)
                              ? availability.filter(a => a !== option)
                              : [...availability, option]
                          }))}
                          className="availability-checkbox"
                        />
                        <label htmlFor={`availability-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="products-grid-container">
            <div className="products-header">
              {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '0.9em', color: '#888' }}>
                  Debug: Filtered {filteredProducts.length} / All {allProducts.length}
                </div>
              )}
              <select
                className="sort-select"
                value={reduxFiltersRaw.sort}
                onChange={e => dispatch(setFilters({ ...reduxFiltersRaw, sort: e.target.value }))}
              >
                <option value="featured">Sort by: Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>

            {/* Active Filters */}
            {(reduxSearchTerm || selectedCategories[0] !== 'All' || priceRange[1] < 10000) && (
              <div className="active-filters">
                {reduxSearchTerm && (
                  <span className="active-filter">
                    Search: {reduxSearchTerm}
                    <button onClick={() => dispatch(setSearchTerm(''))} className="remove-filter">
                      <FaTimes />
                    </button>
                  </span>
                )}
                {selectedCategories[0] !== 'All' && selectedCategories.map(cat => (
                  <span key={cat} className="active-filter">
                    {cat}
                    <button onClick={() => toggleCategory(cat)} className="remove-filter">
                      <FaTimes />
                    </button>
                  </span>
                ))}
                {priceRange[1] < 10000 && (
                  <span className="active-filter">
                    Max: ${priceRange[1]}
                    <button onClick={() => dispatch(setFilters({ ...reduxFiltersRaw, priceRange: [0, 10000] }))} className="remove-filter">
                      <FaTimes />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product._id || product.id || product.sku || idx}
                    product={product}
                    ref={idx === filteredProducts.length - 1 ? lastProductElementRef : null}
                  />
                ))}
              </div>
            ) : (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onClick={resetFilters} className="reset-filters-btn">
                  Reset Filters
                </button>
              </div>
            )}

            {status === 'loadingMore' && <ProductSkeleton count={3} />}
          </div>
        </div>
        <BackToTopButton />
      </div>
    </>
  );
};

export default Products;
