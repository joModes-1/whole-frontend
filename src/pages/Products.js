import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
import useCategoryCounts from '../hooks/useCategoryCounts';
import BackToTopButton from '../components/BackToTopButton';
import './Products.css';

// Error styles are now inlined in the JSX

const Products = () => {
  console.log('[Products.js] Component rendering...');
  const dispatch = useDispatch();
  const location = useLocation();
  const { status, error, hasMore, filters: reduxFiltersRaw, searchTerm: reduxSearchTerm } = useSelector(state => state.products);
  const allProducts = useSelector(selectAllProducts);

  console.log(`[Products.js] State after useSelector: status=${status}, hasMore=${hasMore}, productsCount=${allProducts.length}`);

  useEffect(() => {
    if (error) {
      console.error('[Products.js] Detected an error from Redux:', error);
    }
  }, [error]);

  // Initial fetch only if no URL params and no products loaded
  console.log(`[Products.js] Initial fetch effect triggered. Status: ${status}, Products count: ${allProducts.length}`);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasUrlParams = params.get('search') || params.get('category');
    
    if (!hasUrlParams && allProducts.length === 0 && status !== 'loading') {
      console.log('[Products.js] Conditions met. Dispatching fetchProducts(1).');
      dispatch(fetchProducts(1));
    } else {
      console.log('[Products.js] Conditions not met for initial fetch.');
    }
  }, [dispatch, allProducts.length, status, location.search]);

  useEffect(() => {
    console.log('[Products.js] allProducts from Redux changed, updating local state.');
  }, [allProducts]);

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
        prodCategories = product.category.map(c => (c?.name || c || '').toString().toLowerCase().trim());
      } else if (typeof product.category === 'string') {
        prodCategories = [product.category.toLowerCase().trim()];
      } else if (typeof product.category === 'object' && product.category?.name) {
        prodCategories = [product.category.name.toLowerCase().trim()];
      }

      if (reduxSearchTerm && !name.toLowerCase().includes(reduxSearchTerm.toLowerCase())) {
        return false;
      }

      if (selectedCategories[0] !== 'All') {
        const hasSelectedCategory = prodCategories.some(prodCat =>
          selectedCategories.some(selCat => selCat.toLowerCase().trim() === prodCat)
        );
        if (!hasSelectedCategory) return false;
      }

      if (priceRange[0] > 0 || priceRange[1] < 10000) {
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }

      if (availability.length > 0) {
        const stockStatus = stock > 0 ? 'In Stock' : 'Out of Stock';
        if (!availability.includes(stockStatus)) return false;
      }

      return true;
    });
  }, [allProducts, selectedCategories, priceRange, availability, reduxSearchTerm]);

  const { counts: categoryCounts, loading: loadingCounts } = useCategoryCounts();

  // Handle URL search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const search = params.get('search');

    console.log('[Products] URL params detected:', { category, search });

    // Set search term in Redux state if present
    if (search) {
      console.log('[Products] Setting search term in Redux:', search);
      dispatch(setSearchTerm(search));
    } else if (!search && reduxSearchTerm) {
      // Clear search term if no search in URL
      dispatch(setSearchTerm(''));
    }

    // Set category filter if present, or clear if not
    if (category) {
      const updatedFilters = { ...reduxFiltersRaw, selectedCategories: [category] };
      dispatch(setFilters(updatedFilters));
    } else {
      // Clear category filter if no category in URL
      const updatedFilters = { ...reduxFiltersRaw, selectedCategories: ['All'] };
      dispatch(setFilters(updatedFilters));
    }

    // Reset products and fetch with new parameters
    dispatch(resetProducts());
    
    const fetchParams = { page: 1, limit: 20 };
    if (category) {
      fetchParams.category = category;
    }
    if (search) {
      fetchParams.search = search; // Use 'search' instead of 'keyword'
    }

    console.log('[Products] Fetching products with params:', fetchParams);
    dispatch(fetchProducts(fetchParams));
  }, [dispatch, location.search, reduxFiltersRaw, reduxSearchTerm]); // Include all dependencies used in the effect

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

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button
                  onClick={() => dispatch(fetchProducts(1))}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!error && filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product._id || product.id || product.sku || idx}
                    product={product}
                    ref={idx === filteredProducts.length - 1 ? lastProductElementRef : null}
                  />
                ))}
              </div>
            ) : !error ? (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onClick={resetFilters} className="reset-filters-btn">
                  Reset Filters
                </button>
              </div>
            ) : null}

            {status === 'loadingMore' && <ProductSkeleton count={3} />}
          </div>
        </div>
        <BackToTopButton />
      </div>
    </>
  );
};

export default Products;