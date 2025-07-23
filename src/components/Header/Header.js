import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FaRegUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { FiBell, FiShoppingCart } from 'react-icons/fi';
import TradeAssuranceDropdown from '../TradeAssuranceDropdown';
import HelpDropdown from '../HelpDropdown'
import CategoriesDropdown from '../CategoriesDropdown';
import './Header.css';
import './mobileMenuOnly.css';
import LiveProductSearch from './LiveProductSearch';


const Header = () => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const { user, logout, isSeller } = useAuth();
    const { cart } = useCart();
    const navigate = useNavigate();
    const profileRef = useRef(null);

    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="header">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="container">
                    <div className="top-bar-content">
                        <div className="logo">
                            <Link to="/">
                                <span className="logo-text">Ujii</span>
                            </Link>
                        </div>
                        <div className="search-container-header">
                            <form className="search-bar" onSubmit={e => { e.preventDefault(); handleSearch(e); }} autoComplete="off">
                                <input
                                    type="text"
                                    placeholder="What are you looking for?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoComplete="off"
                                />
                                <button type="submit" className="search-button">
                                    Search
                                </button>
                                {searchQuery.trim() && (
                                    <LiveProductSearch
                                        query={searchQuery}
                                        onSelect={() => setSearchQuery('')}
                                        onBlur={() => { }}
                                    />
                                )}
                            </form>
                        </div>

                        <div className="header-actions">
                            <div>
                                <div className="logo-mobile">
                                    <Link to="/">
                                        <span className="logo-text">Ujii</span>
                                    </Link>
                                </div>
                            </div>
                            <div className="header-actions">
                                <div className="header-action-icons">
                                    <div className="cart-icon">
                                        <Link to="/cart">
                                            <span><FiShoppingCart />
                                                <span> {cartItemCount > 0 && <span className="cart-count">{cartItemCount}</span>} </span>
                                            </span>
                                        </Link>
                                    </div>

                                    <div className="notification-icon">
                                        <Link to="/notifications">
                                            <span><FiBell /></span>
                                        </Link>
                                    </div>
                                </div>

                                {user ? (
                                    <div className="profile-section" ref={profileRef}>
                                        <Link
                                            to="/profile"
                                            className="profile-btn modern-profile-btn"
                                            aria-label={user.name || user.email || 'Profile'}
                                        >
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="profile-avatar" />
                                            ) : (
                                                <FaRegUserCircle size={26} color="#fff" />
                                            )}

                                        </Link>
                                        {isProfileDropdownOpen && (
                                            <div className="profile-dropdown">
                                                <Link to="/profile" className="header-dropdown-item">Profile</Link>
                                                {isSeller ? (
                                                    <Link to="/seller/dashboard" className="header-dropdown-item">Seller Dashboard</Link>
                                                ) : (
                                                    <Link to="/become-seller" className="header-dropdown-item">Become a Seller</Link>
                                                )}
                                                <button onClick={logout} className="header-dropdown-item">Logout</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="auth-buttons">
                                        <Link to="/login" className="login-btn">
                                            Login
                                        </Link>
                                        <Link to="/role-selection" className="register-btn">
                                            Register
                                        </Link>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="main-nav">
                <div className="container">
                    <div className="nav-content">
                        {/* Hamburger icon for mobile */}
                        <button
                            className="hamburger"
                            aria-label="Open menu"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                            onClick={toggleMobileMenu}
                            style={{ display: 'none' }}
                        >
                            {isMobileMenuOpen ? <FaTimes size={24} color="#0264f1" /> : <FaBars size={24} color="#0264f1" />}
                        </button>

                        {/* Desktop navigation - split left/right */}
                        <ul className="nav-links desktop-nav main-nav-left">
                            <li className="nav-item"><CategoriesDropdown /></li>
                            <li className="nav-item"><Link to="/products" className="nav-link">Products</Link></li>
                            <li><TradeAssuranceDropdown /></li>
                        </ul>
                        <ul className="nav-links desktop-nav main-nav-right">
                        {isSeller ? <li><Link to="/seller/products/add" className="create-product-link">+ Add New Product</Link></li> : <></>}
                            {isSeller ? <li><Link to="/seller/dashboard"><span className="dashboard">Dashboard</span></Link></li> : <></>}
                            <li><HelpDropdown /></li>
                        </ul>



                        {/* Mobile dropdown menu - only render on small screens */}
                        <div className="mobile-menu-responsive-wrapper">
                            {isMobileMenuOpen && (
                                <div className="mobile-menu-overlay" onClick={toggleMobileMenu} />
                            )}
                            <div
                                id="mobile-menu"
                                className={`mobile-menu-dropdown${isMobileMenuOpen ? ' open' : ''}`}
                                role="menu"
                                aria-hidden={!isMobileMenuOpen}
                            >
                                <ul className="mobile-nav-links">
                                    <li onClick={toggleMobileMenu}><Link to="/" className="nav-link">Home</Link></li>
                                    <li onClick={toggleMobileMenu}><Link to="/products" className="nav-link">All Products</Link></li>
                                    <li ><HelpDropdown /></li>
                                    <li ><TradeAssuranceDropdown /></li>
                                    {isSeller ? <li onClick={toggleMobileMenu}><Link to="/seller/products/add" className="create-product-link">+ Add New Product</Link></li> : <></>}
                                    {isSeller ? <li onClick={toggleMobileMenu}><Link to="/seller/dashboard"><span className="dashboard">Dashboard</span></Link></li> : <></>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;