import React from 'react';
import { FaStore, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStar, FaUserCheck } from 'react-icons/fa';
import './SellerInfoCard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const SellerInfoCard = ({ seller }) => {
  if (!seller) {
    return (
      <div className="seller-info-card">
        <div className="seller-placeholder">
          <FaStore className="placeholder-icon" />
          <p>Seller information not available</p>
        </div>
      </div>
    );
  }

  const {
    companyName,
    name,
    email,
    phoneNumber,
    profilePicture,
    description,
    address,
    rating,
    totalProducts,
    verified,
    joinedDate
  } = seller;

  const displayName = companyName || name || 'Unknown Seller';
  const sellerRating = rating || 4.5; // Default rating if not provided
  const productCount = totalProducts || 0;

  return (
    <div className="seller-info-card">
      <div className="seller-header">
        <div className="seller-profile-pic-container">
          <img
            className="seller-profile-pic"
            src={profilePicture ? `${API_BASE_URL}${profilePicture}` : 'https://via.placeholder.com/120?text=Seller'}
            alt={displayName}
          />
          {verified && (
            <div className="verified-badge">
              <FaUserCheck />
            </div>
          )}
        </div>
        
        <div className="seller-basic-info">
          <h3 className="seller-company">{displayName}</h3>
          
          <div className="seller-rating">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <FaStar 
                  key={i} 
                  className={i < Math.floor(sellerRating) ? 'star-filled' : 'star-empty'} 
                />
              ))}
            </div>
            <span className="rating-text">({sellerRating.toFixed(1)})</span>
          </div>
          
          <div className="seller-stats">
            <span className="stat">
              <FaStore className="stat-icon" />
              {productCount} Products
            </span>
          </div>
        </div>
      </div>

      {description && (
        <div className="seller-description">
          <p>{description}</p>
        </div>
      )}

      <div className="seller-contact">
        {email && (
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <span>{email}</span>
          </div>
        )}
        
        {phoneNumber && (
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <span>{phoneNumber}</span>
          </div>
        )}
        
        {address && (
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <span>{address}</span>
          </div>
        )}
      </div>

      <div className="seller-actions">
        <button className="btn-contact-seller">
          Contact Seller
        </button>
        <button className="btn-view-store">
          View Store
        </button>
      </div>

      {joinedDate && (
        <div className="seller-joined">
          <small>Member since {new Date(joinedDate).getFullYear()}</small>
        </div>
      )}
    </div>
  );
};

export default SellerInfoCard;
