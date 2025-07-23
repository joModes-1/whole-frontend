import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { CartProvider } from './context/CartContext';
import { QueryProvider } from './components/QueryProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes/AppRoutes';
import './App.css';

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
      <AuthProvider>
        <CartProvider>
          <QueryProvider>
            <Router {...router}>
              <div className="app">
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
      </AuthProvider>
    </PayPalScriptProvider>
  );
}

export default App; 