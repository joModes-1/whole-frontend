import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  const stats = [
    { number: '10,000+', label: 'Active Sellers' },
    { number: '50,000+', label: 'Products' },
    { number: '100+', label: 'Countries' },
    { number: '1M+', label: 'Monthly Users' }
  ];

  const features = [
    {
      title: 'Global Reach',
      description: 'Connect with businesses worldwide and expand your market reach.',
      icon: '🌍'
    },
    {
      title: 'Secure Transactions',
      description: 'Safe and secure payment processing for all your business needs.',
      icon: '🔒'
    },
    {
      title: 'Quality Assurance',
      description: 'Verified suppliers and quality products for your business.',
      icon: '✅'
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your queries.',
      icon: '🔄'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About Our Platform</h1>
          <p>Connecting businesses worldwide through a trusted B2B marketplace</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <h2>{stat.number}</h2>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <h2>Our Mission</h2>
          <p>
            We are dedicated to transforming the way businesses connect and trade globally.
            Our platform provides a secure, efficient, and user-friendly environment for
            businesses to discover new opportunities, build relationships, and grow their
            operations.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="cta-content">
          <h2>Ready to Grow Your Business?</h2>
          <p>Join thousands of businesses already using our platform</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary">Get Started</Link>
            <Link to="/contact" className="btn-outline">Contact Sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 