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
      <li className="help-btn">
        Help <FaChevronDown className="icon" />
      </li>
      {open && (
        <ul className="dropdown-menu">
          <li>Place & Track Order</li>
          <li>Returns and Refund</li>
          <li>Wallet & Payments</li>
          <li>Loyalty Card</li>
          <li>Order Cancellation</li>
          <li>FAQs</li>
          <li>Contact Us</li>
        </ul>
      )}
    </div>
  );
};

export default HelpDropdown;
