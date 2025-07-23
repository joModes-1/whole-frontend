import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth as firebaseAuth } from '../../config/firebase';
import { API_BASE_URL } from '../../config';
import './Auth.css';
import PasswordInput from '../../components/common/PasswordInput';
import { RecaptchaVerifier } from 'firebase/auth';

const Register = () => {
  // BEGIN: NewRegistration.js content
  // (the entire logic and JSX from NewRegistration.js will be placed here)

  const navigate = useNavigate();
  const location = useLocation();
  const { googleSignIn } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  
  // Get auth instance from Firebase config
  const auth = firebaseAuth;
  
  // Debug log to check if auth is available
  useEffect(() => {
    console.log('Auth instance:', { 
      auth, 
      hasAuth: !!auth,
      currentUser: auth?.currentUser 
    });
    
    // Set auth as ready after a short delay to ensure initialization
    const timer = setTimeout(() => {
      setAuthReady(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [auth]);
  const recaptchaVerifierRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: '' // Role will be set from the URL
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    if (!auth || !authReady) return;
    
    const setupRecaptcha = async () => {
      try {
        console.log('Setting up reCAPTCHA...');
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            'recaptcha-container',
            { size: 'invisible' },
            auth
          );
        }
        if (recaptchaVerifierRef.current) {
          try {
            const widgetId = await recaptchaVerifierRef.current.render();
            console.log('reCAPTCHA widget rendered with ID:', widgetId);
          } catch (renderError) {
            console.error('Error rendering reCAPTCHA:', renderError);
            throw renderError;
          }
        } else {
          throw new Error('reCAPTCHA verifier could not be initialized.');
        }
      } catch (error) {
        // Only log reCAPTCHA errors, do not show to user
        console.error('Error setting up reCAPTCHA (suppressed):', error);
        // Do NOT call setError here, just log
      }
    };

    
    setupRecaptcha();
    
    // Cleanup function
    return () => {
      if (recaptchaVerifierRef.current) {
        console.log('Cleaning up reCAPTCHA');
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [auth, authReady]);
  
  // Set role from URL query or navigation state on mount
  useEffect(() => {
    let role = 'buyer';
    // Try navigation state first
    if (location.state && location.state.role) {
      role = location.state.role;
    } else {
      // Then try URL query param
      const params = new URLSearchParams(location.search);
      const roleFromUrl = params.get('role');
      if (roleFromUrl === 'buyer' || roleFromUrl === 'seller') {
        role = roleFromUrl;
      }
    }
    setFormData(prev => ({ ...prev, role }));
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setIsLoading(true);
    setError('');
    // Log user data before sending to backend
    console.log('[Register] User input data:', formData);
    // Format phone number
    const phoneNumber = formData.phoneNumber.startsWith('+') 
      ? formData.phoneNumber 
      : `+${formData.phoneNumber}`;
    try {
      console.log('Initiating phone verification...');

      console.log('Sending verification code...');
      let data = {};
      try {
        // Only send phone for code
        const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error || 'Failed to send verification code.');
          setIsLoading(false);
          return;
        }
        // Store form data for next step
        localStorage.setItem('verifyPhoneFormData', JSON.stringify({ ...formData, phoneNumber, role: formData.role }));
        navigate('/verify-phone');
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        setError(verificationError.message || 'Failed to send verification code.');
        setIsLoading(false);
        return;
      }
      // Go to /verify-phone with phone number only
      // Handle backend response for alreadyExists and verified user
      if (data && data.alreadyExists) {
        let userId = data.userId;
        // Fallback: if userId is missing, try to fetch it from backend
        if (!userId) {
          try {
            // Only send one of phoneNumber or email (prefer phoneNumber if both)
            let findUserPayload = {};
            if (formData.phoneNumber) {
              findUserPayload.phoneNumber = formData.phoneNumber;
            } else if (formData.email) {
              findUserPayload.email = formData.email;
            }
            console.log('Sending to /auth/find-user-id:', findUserPayload);
            const userRes = await fetch(`${API_BASE_URL}/auth/find-user-id`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(findUserPayload)
            });
            const userData = await userRes.json();
            console.log('Response from /find-user-id:', userData);
            if (userData.success && userData.userId) {
              userId = userData.userId;
              console.log('Resolved userId:', userId);
            }
          } catch (e) { /* ignore */ }
        }
        if (!userId) {
          setError('Could not resolve user for verification. Please contact support.');
          setIsLoading(false);
          return;
        }
        formData.userId = userId;
        const verifyFormData = { ...formData, userId, phoneNumber: formData.phoneNumber };
        localStorage.setItem('verifyPhoneFormData', JSON.stringify(verifyFormData));
        navigate('/verify-phone', {
          state: {
            formData: verifyFormData,
            infoMessage: data.message
          }
        });
        setIsLoading(false);
        return;
      }
      if (data && data.success === false && data.error && data.error.includes('Account already exists')) {
        setError('Account already exists. Please log in.');
        setIsLoading(false);
        return;
      }
      // Normal flow for new registration
      let userId = data && data.userId;
      // Fallback: if userId is missing, try to fetch it from backend
      if (!userId) {
        try {
          // Only send one of phoneNumber or email (prefer phoneNumber if both)
          let findUserPayload = {};
          if (formData.phoneNumber) {
            findUserPayload.phoneNumber = formData.phoneNumber;
          } else if (formData.email) {
            findUserPayload.email = formData.email;
          }
          console.log('Sending to /auth/find-user-id:', findUserPayload);
          const userRes = await fetch(`${API_BASE_URL}/auth/find-user-id`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(findUserPayload)
          });
          const userData = await userRes.json();
          console.log('Response from /find-user-id:', userData);
          if (userData.success && userData.userId) {
            userId = userData.userId;
            console.log('Resolved userId:', userId);
          }
        } catch (e) { /* ignore */ }
      }
      if (!userId) {
        setError('Could not resolve user for verification. Please contact support.');
        setIsLoading(false);
        return;
      }
      const verifyFormData = { ...formData, phoneNumber, userId };
      localStorage.setItem('verifyPhoneFormData', JSON.stringify(verifyFormData));
      navigate('/verify-phone', {
        state: {
          formData: verifyFormData
        }
      });

    } catch (error) {
      if (
        error.message && (
          error.message.includes('Failed to send verification code') ||
          error.message.includes('auth/billing-not-enabled') ||
          error.message.includes('auth/invalid-phone-number')
        )
      ) {
        // DEV BYPASS: Skip /verify-phone and go straight to login
        // REMOVE THIS BYPASS FOR PRODUCTION
        console.warn('DEV BYPASS: Skipping phone verification and redirecting to login.', error);
        navigate('/login', { replace: true });
      } else {
        // For all other errors, block registration
        console.error('Registration error details:', error);
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = (e) => {
  setError('');
  setIsLoading(true);
  // Call signInWithPopup directly in response to the click event
  googleSignIn(formData.role)
    .then(user => {
      if (user.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    })
    .catch(() => {
      setError('Failed to sign up with Google. Please try again.');
    })
    .finally(() => {
      setIsLoading(false);
    });
};



  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create a {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Account</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>


          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              placeholder="+254700000000"
            />
            <p className="input-hint">We'll send a verification code to this number</p>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Confirm your password"
            />
          </div>

          {/* reCAPTCHA container - will be invisible */}
          <div id="recaptcha-container"></div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? `Registering as ${formData.role}...` : 'Register'}
          </button>
        </form>

        <div className="or-separator">OR</div>
        <button onClick={handleGoogleLogin} className="google-signin-button" disabled={isLoading}>
          Sign up with Google
        </button>

        <div className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
        <div className="auth-link" style={{ marginTop: '10px' }}>
          <Link to="/role-selection">Back to role selection</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
