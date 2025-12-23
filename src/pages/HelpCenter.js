import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './HelpCenter.css';

const HelpCenter = () => {
  // Web3Forms "access_key" (public). Prefer env var but fall back to provided key so it works out of the box.
  const accessKey = useMemo(
    () => process.env.REACT_APP_WEB3FORMS_ACCESS_KEY || '03df5a28-35cf-461c-ae98-afcdf72088e1',
    []
  );
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const helpCategories = [
    {
      title: 'Ordering',
      icon: '🛒',
      items: ['How to place an order', 'Payment methods', 'Order tracking'],
    },
    {
      title: 'Products',
      icon: '📦',
      items: ['Finding products', 'Product conditions', 'Returns and refunds'],
    },
    {
      title: 'Sellers',
      icon: '🏪',
      items: ['How to become a seller', 'Listing products', 'Seller policies'],
    },
    {
      title: 'Account',
      icon: '👤',
      items: ['Creating an account', 'Profile & security', 'Notifications'],
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('access_key', accessKey);
    // Optional metadata
    formData.append('from_name', 'B2B Platform Help Center');

    try {
      setStatus({ state: 'loading', message: '' });
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ state: 'success', message: 'Thanks! Your message has been sent. We\'ll get back to you soon.' });
        form.reset();
      } else {
        setStatus({ state: 'error', message: data.message || 'Submission failed. Please try again.' });
      }
    } catch (err) {
      setStatus({ state: 'error', message: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="help-center-page">
      {/* Hero Section */}
      <section className="help-hero">
        <div className="help-hero-content">
          <h1>Help Center</h1>
          <p>Find answers to common questions or get in touch with our support team</p>
        </div>
      </section>

      <div className="help-center-container">
        {/* Categories Section */}
        <section className="help-categories-section">
          <h2 className="section-title">Browse by Category</h2>
          <div className="help-categories-grid">
            {helpCategories.map((category, index) => (
              <div key={index} className="help-category-card">
                <div className="category-icon">{category.icon}</div>
                <h3>{category.title}</h3>
                <ul>
                  {category.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="help-contact-section">
          <div className="help-contact-content">
            <h2>Need More Help?</h2>
            <p>Send us a message and we'll get back to you as soon as possible.</p>

            <form className="help-support-form" onSubmit={handleSubmit}>
              <input type="hidden" name="subject" value="Support Request" />
              {/* Honeypot */}
              <input type="checkbox" name="botcheck" className="hp" tabIndex="-1" autoComplete="off" />

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input 
                    id="name" 
                    name="name" 
                    type="text" 
                    className="form-control"
                    placeholder="John Doe" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    className="form-control"
                    placeholder="you@example.com" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="topic">Topic</label>
                <input 
                  id="topic" 
                  name="topic" 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Order issue, Product question" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows="5" 
                  className="form-control"
                  placeholder="Describe your issue or question" 
                  required 
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={status.state === 'loading'}
                >
                  {status.state === 'loading' ? 'Sending…' : 'Send Message'}
                </button>
                <Link to="/contact" className="help-secondary-link">
                  Or visit our Contact page
                </Link>
              </div>

              {status.state === 'success' && (
                <div className="help-alert help-alert-success">{status.message}</div>
              )}
              {status.state === 'error' && (
                <div className="help-alert help-alert-error">{status.message}</div>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;
