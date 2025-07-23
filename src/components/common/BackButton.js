import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = ({ className = '', style = {} }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={`back-button ${className}`}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#781eff', fontWeight: 600, fontSize: 18, cursor: 'pointer', ...style }}
      aria-label="Go back"
      onClick={() => navigate(-1)}
    >
      <FaArrowLeft style={{ fontSize: 20 }} />
      <span>Back</span>
    </button>
  );
};

export default BackButton;
