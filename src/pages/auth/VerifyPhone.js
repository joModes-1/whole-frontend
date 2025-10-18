import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuth } from '../../config/firebase';

import './Auth.css';

const VerifyPhone = () => {
  useEffect(() => {
    console.log('[VerifyPhone] Component mounted');
  }, []);
  const navigate = useNavigate();
  
  const { login } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [testModeCode, setTestModeCode] = useState('');

  // Get data from location state and store confirmationResult in component state
  // Try to get formData from location.state, or fallback to localStorage
  let locationData = useLocation().state || {};
  let formData = locationData.formData;
  if (!formData) {
    try {
      const stored = localStorage.getItem('verifyPhoneFormData');
      if (stored) formData = JSON.parse(stored);
    } catch (e) { /* ignore */ }
  }
  
  // Check if we're in test mode and fetch the verification code
  useEffect(() => {
    const isTestMode = process.env.REACT_APP_TEST_MODE === 'true';
    if (isTestMode && formData && formData.phoneNumber && !testModeCode) {
      // In test mode, fetch the verification code from the backend (only once)
      fetchTestModeCode(formData.phoneNumber);
    }
  }, [formData?.phoneNumber, testModeCode, formData]); // Add formData dependency

  // Redirect if essential data is missing
  useEffect(() => {
    if (!formData || !formData.phoneNumber) {
      console.error('Missing required data for verification, redirecting.');
      navigate('/role-selection', { replace: true });
    }
  }, [formData, navigate]);

  // Handle countdown for resend button
  useEffect(() => {
    let timer;
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown <= 0) {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, countdown]);


  
  // Handle code verification and registration
  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (!verificationCode || verificationCode.length < 4) {
        setError('Please enter the code sent to your phone.');
        setIsLoading(false);
        return;
      }
      
      // Prepare registration data
      const registrationData = {
        ...formData,
        code: verificationCode
      };
      
      // For sellers, include business data in the registration
      if (formData.role === 'seller' && formData.businessInfo) {
        registrationData.businessLocation = formData.businessLocation;
        registrationData.businessInfo = formData.businessInfo;
        // Use business phone if provided, otherwise use main phone
        registrationData.phoneNumber = formData.businessPhone || formData.phoneNumber;
      }
      
      // Send all form data + code to backend for verification and registration
      const response = await fetch(`${API_BASE_URL}/auth/verify-code-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || 'Verification failed.');
        setIsLoading(false);
        return;
      }
      // Log in user, then redirect to profile or seller dashboard
      try {
        // Auto sign-in after registration
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, formData.email, formData.password);
        const idToken = await userCredential.user.getIdToken();
        if (typeof login === 'function') {
          await login(data.user, idToken);
        }
        if (data.user && data.user.role === 'seller') {
          // For sellers, check if they completed business setup
          if (data.user.businessLocation && data.user.businessLocation.formattedAddress) {
            navigate('/seller/dashboard', { replace: true });
          } else {
            // Redirect to seller onboarding if business info is incomplete
            navigate('/seller/onboarding', { replace: true });
          }
        } else {
          // For buyers, redirect to home page
          navigate('/', { replace: true });
        }
      } catch (signInError) {
        // If sign-in fails, fallback to login page
        setError('Account created, but automatic sign-in failed. Please login manually.');
        navigate('/login');
      }
    } catch (err) {
      console.log('[VerifyPhone] Error in handleVerify:', err);
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setResendDisabled(true);
    setCountdown(30);
    try {
      if (!formData.userId) {
        setError('Missing user ID for resending code. Please restart registration.');
        setIsLoading(false);
        return;
      }
      // Use '/auth/send-verification-code' to match backend route
      const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formData.phoneNumber, userId: formData.userId })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code.');
      }
    } catch (error) {
      setError(error.message || 'Failed to resend code.');
    }
    setIsLoading(false);
  };

  // Fetch verification code in test mode
  const fetchTestModeCode = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/get-test-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await response.json();
      if (response.ok && data.code) {
        setTestModeCode(data.code);
      } else {
        // If test mode is not enabled, just log it once
        console.log('Test mode not available:', data.error || 'Test mode is disabled');
        // Set a placeholder to prevent repeated calls
        setTestModeCode(''); 
      }
    } catch (error) {
      console.log('Test mode not available');
      // Set a placeholder to prevent repeated calls
      setTestModeCode('');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Your Phone Number</h2>

        <p className="verification-instruction">
          We've sent a 6-digit verification code to <strong>{formData?.phoneNumber}</strong>.
          Please enter it below to complete your registration.
        </p>
        
        {testModeCode && testModeCode.length > 0 && (
          <div className="test-mode-notification">
            <p><strong>Test Mode:</strong> The verification code is <strong>{testModeCode}</strong></p>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label htmlFor="verificationCode">Verification Code</label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="verification-input"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify & Continue'}
          </button>
          
          <div className="resend-container">
            <p>Didn't receive a code?</p>
            <button
              type="button"
              className="resend-button"
              onClick={handleResendCode}
              disabled={resendDisabled}
            >
              {resendDisabled ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </form>

        {/* This container is used by reCAPTCHA for the resend functionality */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default VerifyPhone;
