import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/Footer';
import Home from '../pages/Home';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import VerifyPhone from '../pages/auth/VerifyPhone';
import RoleSelection from '../pages/auth/RoleSelection';
import About from '../pages/About';
import Contact from '../pages/Contact';

import SearchResults from '../pages/SearchResults';
import Terms from '../pages/Terms';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import HelpCenter from '../pages/HelpCenter';
import RFQForm from '../components/RFQ/RFQForm';
import RFQList from '../components/RFQ/RFQList';
import RFQDetail from '../components/RFQ/RFQDetail';
import PrivateRoute from '../components/PrivateRoute';
import Profile from '../pages/Profile';
import Cart from '../components/Cart/Cart';
import Checkout from '../components/Checkout/Checkout';
import ProcessPayment from '../components/ProcessPayment/ProcessPayment';
import OrderSuccess from '../components/OrderSuccess/OrderSuccess';
import SellerDashboard from '../components/SellerDashboard';
import EditProductPage from '../pages/seller/EditProductPage';
import MyProductsPage from '../pages/seller/MyProductsPage';
import AddProductPage from '../pages/seller/AddProductPage';
import CreateHotDeal from '../pages/CreateHotDeal';
import EditProfilePage from '../pages/EditProfilePage';
import SellerOrdersPage from '../pages/SellerOrdersPage';
import BuyerOrdersPage from '../pages/BuyerOrdersPage';
import Notification from '../pages/Notification';
import Header from '../components/Header/Header';
import TrackOrderPage from '../pages/TrackOrderPage';


const AppRoutes = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/role-selection', '/verify-phone'].includes(location.pathname);
  const isInfoPage = ['/', '/about', '/contact', '/terms', '/privacy-policy', '/help-center'].includes(location.pathname);
  
  return (
    <>
      {!isAuthPage && <Header />}
      <main className={`main-content ${isAuthPage ? 'auth-layout' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
          
          <Route path="/verify-phone" element={!currentUser ? <VerifyPhone /> : <Navigate to="/" />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          {/* User/Buyer Protected Routes */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/process-payment" element={<PrivateRoute><ProcessPayment /></PrivateRoute>} />
          <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute roles={['buyer']}><BuyerOrdersPage /></PrivateRoute>} />
          <Route path="/orders/:id/track" element={<PrivateRoute roles={['buyer']}><TrackOrderPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
<Route path="/notifications" element={<PrivateRoute><Notification /></PrivateRoute>} />
          <Route path="/rfq/new" element={<PrivateRoute roles={['buyer']}><RFQForm /></PrivateRoute>} />
          <Route path="/dashboard/rfq" element={<PrivateRoute roles={['buyer']}><RFQList /></PrivateRoute>} />
          
          {/* RFQ routes accessible by multiple roles */}
          <Route path="/rfq" element={<PrivateRoute roles={['admin', 'seller']}><RFQList /></PrivateRoute>} />
          <Route path="/rfq/:id" element={<PrivateRoute><RFQDetail /></PrivateRoute>} />

          {/* Seller Protected Routes */}
          <Route path="/seller/dashboard" element={<PrivateRoute roles={['seller']}><SellerDashboard /></PrivateRoute>} />
          <Route path="/seller/products/edit/:id" element={<PrivateRoute roles={['seller']}><EditProductPage /></PrivateRoute>} />
          <Route path="/seller/products" element={<PrivateRoute roles={['seller']}><MyProductsPage /></PrivateRoute>} />
          <Route path="/seller/products/add" element={<PrivateRoute roles={['seller']}><AddProductPage /></PrivateRoute>} />
          <Route path="/seller/hot-deals/create" element={<PrivateRoute roles={['seller']}><CreateHotDeal /></PrivateRoute>} />
          <Route path="/seller/orders" element={<PrivateRoute roles={['seller']}><SellerOrdersPage /></PrivateRoute>} />
          

        </Routes>
      </main>
      {isInfoPage && <Footer />}
    </>
  );
};

export default AppRoutes; 