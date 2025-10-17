import React, { useMemo, useState } from 'react';
import './HelpCenter.css';

const HelpCenter = () => {
  const accessKey = useMemo(() => process.env.REACT_APP_WEB3FORMS_ACCESS_KEY || '', []);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessKey) {
      setStatus({ state: 'error', message: 'Missing Web3Forms access key. Set REACT_APP_WEB3FORMS_ACCESS_KEY in frontend/.env' });
      return;
    }

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
        setStatus({ state: 'success', message: 'Thanks! Your message has been sent.' });
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
      <div className="help-center-container">
        <header className="help-center-header">
          <h1>Help Center</h1>
          <p>Find answers to common questions or get in touch with our support team.</p>
        </header>

        <section className="help-center-grid">
          <div className="help-card">
            <h3>Ordering</h3>
            <ul>
              <li>How to place an order</li>
              <li>Payment methods</li>
              <li>Order tracking</li>
            </ul>
          </div>
          <div className="help-card">
            <h3>Products</h3>
            <ul>
              <li>Finding products</li>
              <li>Product conditions</li>
              <li>Returns and refunds</li>
            </ul>
          </div>
          <div className="help-card">
            <h3>Sellers</h3>
            <ul>
              <li>How to become a seller</li>
              <li>Listing products</li>
              <li>Seller policies</li>
            </ul>
          </div>
          <div className="help-card">
            <h3>Account</h3>
            <ul>
              <li>Creating an account</li>
              <li>Profile & security</li>
              <li>Notifications</li>
            </ul>
          </div>
        </section>

        <section className="help-contact">
          <h2>Need more help?</h2>
          <p>Send us a message and we'll get back to you as soon as possible.</p>

          {!accessKey && (
            <div className="help-alert help-alert-warning">
              REACT_APP_WEB3FORMS_ACCESS_KEY is not set. Submissions will be disabled until you add it to frontend/.env.
            </div>
          )}

          <form className="support-form" onSubmit={handleSubmit}>
            <input type="hidden" name="subject" value="Support Request" />
            {/* Honeypot */}
            <input type="checkbox" name="botcheck" className="hp" tabIndex="-1" autoComplete="off" />

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="name">Your Name</label>
                <input id="name" name="name" type="text" placeholder="John Doe" required />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="you@example.com" required />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="topic">Topic</label>
              <input id="topic" name="topic" type="text" placeholder="e.g. Order issue, Product question" />
            </div>

            <div className="form-field">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows="5" placeholder="Describe your issue or question" required />
            </div>

            <div className="form-actions">
              <button type="submit" className="help-contact-button" disabled={status.state === 'loading' || !accessKey}>
                {status.state === 'loading' ? 'Sending…' : 'Send Message'}
              </button>
              <a href="/admin" className="help-secondary-link">Or go to Contact page</a>
            </div>

            {status.state === 'success' && (
              <div className="help-alert help-alert-success">{status.message}</div>
            )}
            {status.state === 'error' && (
              <div className="help-alert help-alert-error">{status.message}</div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;
