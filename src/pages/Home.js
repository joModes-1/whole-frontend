import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeroSection from '../components/HeroSection/HeroSection';
import ProductCard from '../components/ProductCard/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton/ProductSkeleton';
import { 
  FiSearch, 
  FiX, 
  FiTag, 
  FiFilter,
  FiRefreshCw,
  FiShoppingBag,
  FiMonitor,
  FiSmartphone,
  FiHome,
  FiTruck,
  FiHeart,
  FiBook,
  FiMusic
} from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [handpickedProducts, setHandpickedProducts] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [hotDeals, setHotDeals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category icons mapping
  const getCategoryIcon = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('electronic') || categoryLower.includes('tech')) return FiMonitor;
    if (categoryLower.includes('phone') || categoryLower.includes('mobile')) return FiSmartphone;
    if (categoryLower.includes('fashion') || categoryLower.includes('clothing')) return FiShoppingBag;
    if (categoryLower.includes('home') || categoryLower.includes('furniture')) return FiHome;
    if (categoryLower.includes('automotive') || categoryLower.includes('car')) return FiTruck;
    if (categoryLower.includes('health') || categoryLower.includes('beauty')) return FiHeart;
    if (categoryLower.includes('book') || categoryLower.includes('education')) return FiBook;
    if (categoryLower.includes('music') || categoryLower.includes('audio')) return FiMusic;
    return FiTag; // Default icon
  };

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch a batch of products to distribute across sections
        const productsRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products?page=1&limit=50`);
        console.log('[Home] Products response:', productsRes.data);
        const allProducts = productsRes.data?.products || [];

        // Fetch category data
        const categoriesRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products/categories/counts`);
        console.log('[Home] Categories response:', categoriesRes.data);
        const categoryData = categoriesRes.data?.data || {};
        const categoryList = Object.keys(categoryData)
          .filter(cat => cat !== 'All' && categoryData[cat] > 0)
          .slice(0, 8); // Take top 8 categories
        
        console.log('[Home] Featured categories:', categoryList);

        // Fetch trending products
        const trendingRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/products/trending`);
        console.log('[Home] Trending products response:', trendingRes.data);
        const trendingProductsData = trendingRes.data?.products || [];

        // Distribute products into different sections for the demo layout
        setHandpickedProducts(allProducts.slice(0, 8));
        setHotDeals(allProducts.slice(8, 16));
        setTrendingProducts(trendingProductsData);
        setFeaturedCategories(categoryList);

      } catch (err) {
        console.error('[Home] Error fetching home page data:', err);
        setError('Failed to load the marketplace. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomePageData();
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <div className="hero-skeleton" style={{ height: '400px', backgroundColor: '#f0f0f0', marginBottom: '2rem' }}></div>
        <div className="products-grid">
          <ProductSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Something Went Wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <HeroSection featuredProducts={handpickedProducts.slice(0, 4)} />

      <main className="home-content-sections">
        {/* Handpicked For You Section */}
        <section className="home-product-showcase">
          <h2 className="section-title">Handpicked For You</h2>
          <div className="products-grid">
            {handpickedProducts.map(product => (
              <ProductCard key={`handpicked-${product._id}`} product={product} />
            ))}
          </div>
        </section>

        {/* Featured Categories Section */}
        <section className="home-category-showcase">
          <h2 className="section-title">Shop by Category</h2>
          <div className="category-grid">
            {featuredCategories.map(category => {
              const IconComponent = getCategoryIcon(category);
              return (
                <div 
                  key={category} 
                  className="category-card-item"
                  onClick={() => handleCategoryClick(category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCategoryClick(category);
                    }
                  }}
                >
                  <div className="category-card-image-placeholder">
                    <IconComponent size={32} />
                  </div>
                  <h3>{category}</h3>
                  <p className="category-card-subtitle">Explore {category}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hot Deals Section */}
        <section className="home-product-showcase">
          <h2 className="section-title">Hot Deals</h2>
          <div className="products-grid">
            {hotDeals.map(product => (
              <ProductCard key={`hotdeal-${product._id}`} product={product} />
            ))}
          </div>
        </section>

        {/* Trending Products Section */}
        <section className="home-product-showcase">
          <h2 className="section-title">Trending Products</h2>
          <div className="products-grid">
            {trendingProducts.map(product => (
              <ProductCard key={`trending-${product._id}`} product={product} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;