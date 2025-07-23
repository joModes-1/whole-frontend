import React, { useEffect, useState } from 'react';

const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`back-to-top-btn${visible ? ' show' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 32,
        zIndex: 9999,
        display: visible ? 'block' : 'none',
        background: '#781eff',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: 48,
        height: 48,
        boxShadow: '0 2px 8px rgba(120,30,255,0.18)',
        fontSize: 28,
        cursor: 'pointer',
        transition: 'background 0.2s, opacity 0.2s',
        opacity: visible ? 1 : 0,
        outline: 'none',
      }}
    >
      ↑
    </button>
  );
};

export default BackToTopButton;
