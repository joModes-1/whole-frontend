import React from 'react';
import './Contact.css';

export default function Contact() {
  const [result, setResult] = React.useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending....");
    const formData = new FormData(event.target);

    formData.append("access_key", "00d7aa2d-6a08-4691-8da8-9cca64a0aa3a");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setResult("Form Submitted Successfully");
      event.target.reset();
    } else {
      console.log("Error", data);
      setResult(data.message);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Contact Us</h1>
        <p>Get in touch with our team for any questions or support</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="info-card">
            <h3>Office Location</h3>
            <p>123 Business Avenue</p>
            <p>Suite 100</p>
            <p>New York, NY 10001</p>
          </div>

          <div className="info-card">
            <h3>Contact Information</h3>
            <p>Email: support@b2bplatform.com</p>
            <p>Phone: +1 (555) 123-4567</p>
            <p>Hours: Mon-Fri, 9am-6pm EST</p>
          </div>

          <div className="info-card">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="#!" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="#!" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="#!" target="_blank" rel="noopener noreferrer">Facebook</a>
            </div>
          </div>
        </div>

        <div className="contact-form-container">
          <h2>Send us a Message</h2>
          <span>{result}</span>
          <form onSubmit={onSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" name="name" id="name" required />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" name="email" id="email" required />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea name="message" id="message" required rows="5"></textarea>
            </div>

            <button type="submit" className="btn-primary">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 