import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

const RoleSelection = () => {
  const navigate = useNavigate();

  const handleSelection = (role) => {
    navigate(`/register?role=${role}`);
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-header">
        <h2>Join as a Buyer or Seller</h2>
        <p>Choose how you want to use the platform.</p>
      </div>
      <div className="role-selection-cards">
        <div className="role-card" onClick={() => handleSelection('buyer')}>
          <h3>I'm a Buyer</h3>
          <p>Find products, request quotes, and manage your purchases.</p>
          <button className="btn-primary">Sign Up as a Buyer</button>
        </div>
        <div className="role-card" onClick={() => handleSelection('seller')}>
          <h3>I'm a Seller</h3>
          <p>List your products, reach new customers, and grow your business.</p>
          <button className="btn-secondary">Sign Up as a Seller</button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
