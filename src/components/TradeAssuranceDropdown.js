import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiChevronDown, FiCheck } from 'react-icons/fi';
import './TradeAssuranceDropdown.css';

const TradeAssuranceDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const features = [
    'Order Protection',
    'Secure Payments',
    'Verified Suppliers',
    'Quality Assurance',
    'On-time Delivery'
  ];

  return (
    <div className="trade-assurance-container" ref={dropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
      <button 
        className="trade-assurance-toggle"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(2, 100, 241, 0.2)',
          borderRadius: '24px',
          padding: '8px 16px',
          color: '#1a202c',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <FiShield style={{ color: '#0264f1', fontSize: '16px' }} />
        <span>Trade Assurance</span>
        <FiChevronDown style={{
          transition: 'transform 0.2s ease',
          fontSize: '16px',
          color: '#64748b',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
        }} />
      </button>
      
      {isOpen && (
        <div style={{
          top: '100%',
          right: 0,
          maxWidth: '320px',
          width: '100%',
          paddingInline: '10px',
          marginTop: '8px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          border: '1px solid #e2e8f0',
          zIndex: 1000
        }}>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #f8faff 0%, #eef4ff 100%)',
            borderBottom: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <FiShield style={{
              color: '#0264f1',
              fontSize: '24px',
              background: 'rgba(2, 100, 241, 0.1)',
              padding: '12px',
              borderRadius: '50%',
              marginBottom: '12px'
            }} />
            <h3 style={{
              margin: '8px 0 4px',
              color: '#1e293b',
              fontSize: '16px',
              fontWeight: 600
            }}>Trade Assurance Protection</h3>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '13px',
              lineHeight: 1.4
            }}>Your order is protected from payment to delivery</p>
          </div>
          <ul className='dropdown-uls'>
            {features.map((feature, index) => (
              <li key={index} >
                <FiCheck style={{
                  color: '#10b981',
                  marginRight: '12px',
                  flexShrink: 0
                }} />
                {feature}
              </li>
            ))}
          </ul>
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            textAlign: 'center'
          }}>
            <Link to="/trade-assurance" style={{
              color: '#0264f1',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.2s ease'
            }}>
              Learn more about Trade Assurance
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeAssuranceDropdown;
