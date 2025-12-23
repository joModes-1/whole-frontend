import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiShoppingBag,
  FiMonitor,
  FiSmartphone,
  FiHome,
  FiTruck,
  FiHeart,
  FiBook,
  FiMusic,
  FiTag,
  FiStar,
  FiArrowRight,
  FiMessageCircle,
  FiMaximize2,
  FiHelpCircle
} from 'react-icons/fi';
import './FeaturedProductsLayout.css';

const FeaturedProductsLayout = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [product1, setProduct1] = useState(null);
  const [product2, setProduct2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adSlides, setAdSlides] = useState([]); // [{ category, images: [url...] }]
  const [activeAdSlide, setActiveAdSlide] = useState(0);

  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  // Category icons mapping
  const getCategoryIcon = (categoryName) => {
    const categoryLower = (categoryName || '').toLowerCase();
    if (categoryLower.includes('electronic') || categoryLower.includes('tech') || categoryLower.includes('laptop')) return FiMonitor;
    if (categoryLower.includes('phone') || categoryLower.includes('mobile')) return FiSmartphone;
    if (categoryLower.includes('fashion') || categoryLower.includes('clothing') || categoryLower.includes('apparel')) return FiShoppingBag;
    if (categoryLower.includes('home') || categoryLower.includes('furniture')) return FiHome;
    if (categoryLower.includes('automotive') || categoryLower.includes('car') || categoryLower.includes('motorcycle')) return FiTruck;
    if (categoryLower.includes('health') || categoryLower.includes('beauty')) return FiHeart;
    if (categoryLower.includes('book') || categoryLower.includes('education')) return FiBook;
    if (categoryLower.includes('music') || categoryLower.includes('audio')) return FiMusic;
    if (categoryLower.includes('sport') || categoryLower.includes('entertainment')) return FiTruck;
    if (categoryLower.includes('jewelry') || categoryLower.includes('watch')) return FiTag;
    return FiTag;
  };

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
    if (candidate.startsWith('/')) return `${apiBase}${candidate}`;
    if (candidate.startsWith('uploads')) return `${apiBase}/${candidate}`;
    return `${apiBase}/uploads/${candidate}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesRes = await axios.get(`${apiBase}/products/categories/counts`);
        let categoryList = [];
        if (categoriesRes.status === 200) {
          const categoryData = categoriesRes.data?.data || {};
          categoryList = Object.keys(categoryData)
            .filter((name) => name !== 'All')
            .slice(0, 10);
        }

        // Fetch all products to get different categories
        const productsRes = await axios.get(`${apiBase}/products?page=1&limit=100`);
        const allProducts = productsRes.data?.products || productsRes.data || [];

        // Get products from different categories
        const categoriesWithProducts = {};
        allProducts.forEach(product => {
          if (product.category && !categoriesWithProducts[product.category]) {
            categoriesWithProducts[product.category] = product;
          }
        });

        const categoryNames = Object.keys(categoriesWithProducts);
        
        // Set product 1 from first category
        if (categoryNames.length > 0) {
          setProduct1(categoriesWithProducts[categoryNames[0]]);
        }

        // Set product 2 from second category (or different category)
        if (categoryNames.length > 1) {
          setProduct2(categoriesWithProducts[categoryNames[1]]);
        } else if (categoryNames.length === 1 && allProducts.length > 1) {
          // If only one category, get second product from same category
          const secondProduct = allProducts.find(p => 
            p.category === categoryNames[0] && p._id !== categoriesWithProducts[categoryNames[0]]._id
          );
          if (secondProduct) setProduct2(secondProduct);
        }

        // Fallback: if no categories, use first two products
        if (categoryList.length === 0 && allProducts.length > 0) {
          const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
          categoryList = uniqueCategories.slice(0, 10);
        }

        setCategories(categoryList);

        // Build banner "ads" slides from real products: each slide is a category with 5 product images
        const imagesByCategory = {};
        for (const p of allProducts) {
          const cat = p?.category;
          if (!cat) continue;
          const img = getImageUrl(p);
          if (!img) continue;
          if (!imagesByCategory[cat]) imagesByCategory[cat] = [];
          if (imagesByCategory[cat].length < 5) imagesByCategory[cat].push(img);
        }

        const slideCats = Object.keys(imagesByCategory).filter((c) => imagesByCategory[c]?.length);
        const slides = slideCats.slice(0, 6).map((cat) => ({
          category: cat,
          images: imagesByCategory[cat].slice(0, 5),
        }));
        setAdSlides(slides);
        setActiveAdSlide(0);

      } catch (error) {
        console.error('Error fetching featured products data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBase]);

  // Auto-rotate the banner slider
  useEffect(() => {
    if (!adSlides || adSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveAdSlide((prev) => (prev + 1) % adSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [adSlides]);

  const handleProductClick = (product) => {
    if (product && product._id) {
      navigate(`/products/${product._id}`);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <div className="featured-products-layout">
        <div className="featured-products-loading">Loading...</div>
      </div>
    );
  }

  const product1Image = getImageUrl(product1);
  const product2Image = getImageUrl(product2);
  const product1Category = product1?.category || 'Product';
  const product2Category = product2?.category || 'Product';

  return (
    <div className="featured-products-layout">
      {/* Left Sidebar - Categories */}
      <div className="featured-sidebar">
        <div className="sidebar-header">
          <FiStar className="sidebar-star-icon" />
          <h3 className="sidebar-title">Categories for you</h3>
        </div>
        <div className="sidebar-categories">
          {categories.slice(0, 8).map((category, index) => {
            const IconComponent = getCategoryIcon(category);
            return (
              <div
                key={category || index}
                className="sidebar-category-item"
                onClick={() => handleCategoryClick(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCategoryClick(category);
                  }
                }}
              >
                <IconComponent className="category-icon" />
                <span className="category-name">{category}</span>
                <FiArrowRight className="category-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Section - Frequently Searched Products */}
      <div className="featured-products-center">
        {/* Product 1 */}
        {product1 && (
          <div 
            className="frequently-searched-card"
            onClick={() => handleProductClick(product1)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleProductClick(product1);
              }
            }}
          >
            <div className="frequently-searched-header">
              <span className="frequently-searched-label">Frequently searched</span>
            </div>
            <div className="frequently-searched-content">
              <h3 className="frequently-searched-title">{product1Category}</h3>
              <div className="frequently-searched-image-container">
                {product1Image ? (
                  <img 
                    src={product1Image} 
                    alt={product1.name || product1Category}
                    className="frequently-searched-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="frequently-searched-placeholder">
                    {(() => {
                      const IconComponent = getCategoryIcon(product1Category);
                      return <IconComponent className="placeholder-icon" />;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product 2 */}
        {product2 && (
          <div 
            className="frequently-searched-card"
            onClick={() => handleProductClick(product2)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleProductClick(product2);
              }
            }}
          >
            <div className="frequently-searched-header">
              <span className="frequently-searched-label">Frequently searched</span>
            </div>
            <div className="frequently-searched-content">
              <h3 className="frequently-searched-title">{product2Category}</h3>
              <div className="frequently-searched-image-container">
                {product2Image ? (
                  <img 
                    src={product2Image} 
                    alt={product2.name || product2Category}
                    className="frequently-searched-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="frequently-searched-placeholder">
                    {(() => {
                      const IconComponent = getCategoryIcon(product2Category);
                      return <IconComponent className="placeholder-icon" />;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Banner - Slider (real product images, per-category) */}
      <div className="featured-banner">
        <h2 className="banner-title">Discover new manufacturers</h2>

        {adSlides.length > 0 ? (
          <>
            <div className="banner-slide">
              <div className="banner-products-preview">
                {adSlides[activeAdSlide]?.images?.map((src, idx) => (
                  <div key={`${activeAdSlide}-${idx}`} className="banner-product-item">
                    <img
                      src={src}
                      alt={adSlides[activeAdSlide]?.category || 'Ad'}
                      className="banner-product-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>

              <button
                className="banner-view-more-btn"
                onClick={() => handleCategoryClick(adSlides[activeAdSlide]?.category || '')}
              >
                Explore more
              </button>
            </div>

            <div className="banner-dots">
              {adSlides.map((_, i) => (
                <span
                  key={`dot-${i}`}
                  className={`banner-dot ${i === activeAdSlide ? 'active' : ''}`}
                  onClick={() => setActiveAdSlide(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveAdSlide(i);
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="banner-products-preview banner-products-preview--empty">
              <div className="banner-product-item"></div>
              <div className="banner-product-item"></div>
              <div className="banner-product-item"></div>
              <div className="banner-product-item"></div>
              <div className="banner-product-item"></div>
            </div>
            <button className="banner-view-more-btn" onClick={() => navigate('/products')}>
              Explore more
            </button>
          </>
        )}
      </div>

      {/* Right Side Utility Icons */}
      <div className="featured-utility-icons">
        <button className="utility-icon-btn" aria-label="Chat">
          <FiMessageCircle />
        </button>
        <button className="utility-icon-btn" aria-label="Fullscreen">
          <FiMaximize2 />
        </button>
        <button className="utility-icon-btn" aria-label="Help">
          <FiHelpCircle />
        </button>
      </div>
    </div>
  );
};

export default FeaturedProductsLayout;

