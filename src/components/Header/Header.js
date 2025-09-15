import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUserCircle, FaBell, FaShoppingCart, FaBars, FaTimes, FaChartBar, FaBox, FaList } from 'react-icons/fa';
import { clearUser } from '../../redux/userSlice'; 
import { useCart } from '../../context/CartContext';
import CategoriesDropdown from '../CategoriesDropdown';
import TradeAssuranceDropdown from '../TradeAssuranceDropdown';
import LiveProductSearch from './LiveProductSearch';
import './Header.css';
import './mobileMenuOnly.css';

const BUYER_ORDERS_PATH = process.env.REACT_APP_BUYER_ORDERS_PATH || '/orders';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user } = useSelector(state => state.user);
  const isAuthenticated = !!user;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const { cart } = useCart();
  const cartCount = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;
  
  // Check if user is a seller
  const isSeller = user?.role === 'seller';

  const handleLogout = () => {
    dispatch(clearUser());
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="main-header" ref={headerRef}>
        <div className="header-container">
          <div className="header-top">
            <div className="logo">
              <Link to="/" className="logo-link">
                <span className="logo-text">Ujii</span>
              </Link>
            </div>

            {/* The one and only search bar */}
            <div className="search-container-header">
              <LiveProductSearch />
            </div>
            <div className="logo-mobile-container">
              <Link to="/" className="logo-link">
                <span className="logo-mobile">Ujii</span>
              </Link>
            </div>
            <div className="header-actions">
              <div className="header-icons">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="header-icon" aria-label="Profile"><FaUserCircle /></Link>
                    <Link to="/notifications" className="header-icon" aria-label="Notifications"><FaBell /></Link>
                  </>
                ) : (
                  <div className="header-auth-links">
                    <Link to="/login" className="auth-link">Login</Link>
                    <Link to="/register" className="auth-link auth-link-primary">Register</Link>
                  </div>
                )}
                <div className="cart-icon">
                  <Link to="/cart" className="header-icon" aria-label="Cart"><FaShoppingCart /></Link>
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </div>
                <button onClick={toggleMobileMenu} className="mobile-menu-toggle" aria-label="Toggle menu">
                  {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
              </div>
            </div>
          </div>
          {/* Mobile Menu Overlay */}
          <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`} onClick={toggleMobileMenu}></div>

        {/* Mobile-only search section below header on small screens */}
        <div className="mobile-searchbar">
          <LiveProductSearch />
        </div>

        <nav className={`header-bottom ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div className="nav-container">
            {/* Desktop Navigation */}
            <ul className="nav-links desktop-nav">
              <li className="nav-item"><CategoriesDropdown /></li>
              {!isSeller && (
                <>
                  <li className="nav-item nav-right-start"><Link to={BUYER_ORDERS_PATH} className="nav-link"><FaList /> My Orders</Link></li>
                </>
              )}
              {isSeller && (
                <>
                  <li className="nav-item nav-right-start"><Link to="/seller/dashboard" className="nav-link"><FaChartBar /> Dashboard</Link></li>
                  <li className="nav-item"><Link to="/seller/products" className="nav-link"><FaBox /> My Products</Link></li>
                  <li className="nav-item"><Link to="/seller/orders" className="nav-link"><FaList /> Orders</Link></li>
                </>
              )}
              <li className="nav-item"><Link to="/help-center" className="nav-link">Help Center</Link></li>
              <li className="nav-item"><TradeAssuranceDropdown /></li>
            </ul>

            {/* Mobile Navigation */}
            <ul className={`nav-links mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
              <li className="nav-item"><Link to="/" className="nav-link" onClick={toggleMobileMenu}>Home</Link></li>
              {!isSeller && (
                <>
                  <li className="nav-item"><Link to={BUYER_ORDERS_PATH} className="nav-link" onClick={toggleMobileMenu}>My Orders</Link></li>
                </>
              )}
              {isSeller && (
                <>
                  <li className="nav-item"><Link to="/seller/dashboard" className="nav-link" onClick={toggleMobileMenu}>Dashboard</Link></li>
                  <li className="nav-item"><Link to="/seller/products" className="nav-link" onClick={toggleMobileMenu}>My Products</Link></li>
                  <li className="nav-item"><Link to="/seller/orders" className="nav-link" onClick={toggleMobileMenu}>Orders</Link></li>
                </>
              )}
              <li className="nav-item"><Link to="/help-center" className="nav-link" onClick={toggleMobileMenu}>Help Center</Link></li>
              <hr />
              {isAuthenticated ? (
                <li className="nav-item" onClick={() => { handleLogout(); toggleMobileMenu(); }}><span className="nav-link">Logout</span></li>
              ) : (
                <>
                  <li className="nav-item"><Link to="/login" className="nav-link" onClick={toggleMobileMenu}>Login</Link></li>
                  <li className="nav-item"><Link to="/register" className="nav-link" onClick={toggleMobileMenu}>Register</Link></li>
                </>
              )}
            </ul>
          </div>
        </nav>
        </div>
      </header>
      
      
    </>
  );
};

export default Header;
