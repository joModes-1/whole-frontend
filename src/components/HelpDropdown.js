import React, { useState } from 'react';
import './HelpDropdown.css';
import { FaChevronDown } from 'react-icons/fa';

const HelpDropdown = () => {
  const [open, setOpen] = useState(false);

  return (
    <div 
      className="help-dropdown"
      onClick={() => setOpen(!open)} 
    >
      <button className="help-btn">
        Help <FaChevronDown className="icon" />
      </button>
      {open && (
        <ul className="dropdown-menu">
          <li><a href="#">Place & Track Order</a></li>
          <li><a href="#">Returns and Refund</a></li>
          <li><a href="#">Wallet & Payments</a></li>
          <li><a href="#">Loyalty Card</a></li>
          <li><a href="#">Order Cancellation</a></li>
          <li><a href="#">FAQs</a></li>
          <li><a href="#">Contact Us</a></li>
        </ul>
      )}
    </div>
  );
};

export default HelpDropdown;
