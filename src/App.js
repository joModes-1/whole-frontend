import React, { useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CartProvider } from './context/CartContext';
import { QueryProvider } from './components/QueryProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes/AppRoutes';
import './App.css';

// Scroll to top on route change to avoid landing at the bottom when content loads
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash, location.search]);
  return null;
}

// Configure router future flags
const initialPayPalOptions = {
  'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID || 'sb', // Using 'sb' as a fallback for sandbox
  currency: 'USD',
  intent: 'capture',
};

// Configure router future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <PayPalScriptProvider options={initialPayPalOptions}>
      {/* AuthProvider is already applied in src/index.js; avoid double wrapping */}
      <CartProvider>
        <QueryProvider>
          <Router {...router}>
            <div className="app">
              <ScrollToTop />
              <AppRoutes />
              <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
        </QueryProvider>
      </CartProvider>
    </PayPalScriptProvider>
  );
}

export default App;