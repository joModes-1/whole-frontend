import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = ({ featuredProducts = [] }) => {
  // Removed console.log to prevent excessive logging
  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  const getImageUrl = (product) => {
    let candidate = product.images?.[0] || product.imageUrl || product.image || product.photo || '';

    // If candidate is an object (e.g. Cloudinary response) try common keys
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


  const placeholderImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
  ];

  const sliderImages = featuredProducts
    .slice(0, 5)
    .map((p, index) => getImageUrl(p) || placeholderImages[index]);
    
  while (sliderImages.length < 5) {
    sliderImages.push(placeholderImages[sliderImages.length]);
  }

  const [currentSlide, setCurrentSlide] = useState(0);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [sliderImages.length]);

  return (
    <div className="hero-section-simplified">
      {/* Middle Column: Image Slider */}
      <div className="hero-slider">
        {sliderImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className={currentSlide === index ? 'active-slide' : ''}
            onError={(e) => {
              e.target.onerror = null; // prevent infinite loop
              e.target.src = placeholderImages[index % placeholderImages.length];
            }}
          />
        ))}
        {sliderImages.length > 1 && (
          <>
            <button className="slider-btn prev" onClick={prevSlide} aria-label="Previous slide">
              <FaChevronLeft />
            </button>
            <button className="slider-btn next" onClick={nextSlide} aria-label="Next slide">
              <FaChevronRight />
            </button>
          </>
        )}
        <div className="slider-dots">
          {sliderImages.map((_, index) => (
            <span
              key={index}
              className={`dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      </div>

      {/* Right Column: You May Like */}
      <div className="hero-recommendations hide-on-mobile">
        <h4>You may like</h4>
        <div className="recommendations-grid">
          {featuredProducts.slice(5, 10).map((product) => (
            <Link to={`/products/${product._id || product.id}`} key={product._id || product.id} className="recommendation-card">
              <img src={getImageUrl(product) || 'https://via.placeholder.com/150'} alt={product.name} />
              <p>{product.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
