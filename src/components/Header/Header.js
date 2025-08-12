import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUserCircle, FaBell, FaShoppingCart, FaBars, FaTimes, FaChartBar, FaBox, FaList } from 'react-icons/fa';
import { clearUser } from '../../redux/userSlice'; 
import CategoriesDropdown from '../CategoriesDropdown';
import TradeAssuranceDropdown from '../TradeAssuranceDropdown';
import LiveProductSearch from './LiveProductSearch';
import './Header.css';
import './mobileMenuOnly.css';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user } = useSelector(state => state.user);
  const isAuthenticated = !!user;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  
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
                <Link to="/cart" className="header-icon" aria-label="Cart"><FaShoppingCart /></Link>
                <button onClick={toggleMobileMenu} className="mobile-menu-toggle" aria-label="Toggle menu">
                  {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
              </div>
            </div>
          </div>

        <nav className={`header-bottom ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div className="nav-container">
            {/* Desktop Navigation */}
            <ul className="nav-links desktop-nav">
              <li className="nav-item"><CategoriesDropdown /></li>
              <li className="nav-item"><TradeAssuranceDropdown /></li>
              {!isSeller && (
                <li className="nav-item"><Link to="/sell-on-ujii" className="nav-link">Sell on Ujii</Link></li>
              )}
              {isSeller && (
                <>
                  <li className="nav-item"><Link to="/seller/dashboard" className="nav-link"><FaChartBar /> Dashboard</Link></li>
                  <li className="nav-item"><Link to="/seller/products" className="nav-link"><FaBox /> My Products</Link></li>
                  <li className="nav-item"><Link to="/seller/orders" className="nav-link"><FaList /> Orders</Link></li>
                </>
              )}
              <li className="nav-item"><Link to="/help-center" className="nav-link">Help Center</Link></li>
            </ul>

            {/* Mobile Navigation */}
            <ul className="nav-links mobile-nav">
              <li className="nav-item"><Link to="/" className="nav-link">Home</Link></li>
              <li className="nav-item"><CategoriesDropdown /></li>
              <li className="nav-item"><TradeAssuranceDropdown /></li>
              {!isSeller && (
                <li className="nav-item"><Link to="/sell-on-ujii" className="nav-link">Sell on Ujii</Link></li>
              )}
              {isSeller && (
                <>
                  <li className="nav-item"><Link to="/seller/dashboard" className="nav-link">Dashboard</Link></li>
                  <li className="nav-item"><Link to="/seller/products" className="nav-link">My Products</Link></li>
                  <li className="nav-item"><Link to="/seller/orders" className="nav-link">Orders</Link></li>
                </>
              )}
              <li className="nav-item"><Link to="/help-center" className="nav-link">Help Center</Link></li>
              <hr />
              {isAuthenticated ? (
                <li className="nav-item" onClick={handleLogout}><span className="nav-link">Logout</span></li>
              ) : (
                <>
                  <li className="nav-item"><Link to="/login" className="nav-link">Login</Link></li>
                  <li className="nav-item"><Link to="/register" className="nav-link">Register</Link></li>
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
