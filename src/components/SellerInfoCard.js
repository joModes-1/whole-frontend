import React from 'react';
import './SellerInfoCard.css';

const SellerInfoCard = ({ seller }) => {
  if (!seller) return null;
  const {
    companyName,
    name,
    email,
    phoneNumber,
    profilePicture,
    description,
    address,
  } = seller;

  return (
    <div className="seller-info-card">
      <div className="seller-profile-pic-container">
        <img
          className="seller-profile-pic"
          src={profilePicture || 'https://via.placeholder.com/120?text=Seller'}
          alt={companyName || name || 'Seller'}
        />
      </div>
      <div className="seller-info-details">
        <h3 className="seller-company">{companyName || name}</h3>
        {description && <p className="seller-description">{description}</p>}
        <div className="seller-contact">
          {email && <p><strong>Email:</strong> {email}</p>}
          {phoneNumber && <p><strong>Phone:</strong> {phoneNumber}</p>}
          {address && <p><strong>Address:</strong> {address}</p>}
        </div>
      </div>
    </div>
  );
};

export default SellerInfoCard;
