import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './EmailVerification.css';

const EmailVerification = ({ email, onVerified }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [displayCode, setDisplayCode] = useState('');

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendVerificationCode = async () => {
    // Don't allow resending if already verified
    if (success) {
      setError('Email is already verified. Please proceed with registration.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Use shorter timeout for email verification (15 seconds)
      const response = await api.post('/email-verification/send-code', { email }, {
        timeout: 15000 // 15 seconds
      });
      console.log('Email verification response:', response.data);
      
      // Check if email is already verified
      if (response.data?.message?.includes('already verified')) {
        setSuccess(true);
        if (onVerified) {
          onVerified({
            email,
            tempToken: sessionStorage.getItem('emailVerificationToken'),
            verified: true
          });
        }
        return;
      }
      
      setCodeSent(true);
      setResendTimer(60); // 60 seconds before resend
      setSuccess(false);
      // Display the code if returned from backend (for testing)
      if (response.data?.verificationCode) {
        console.log('Verification code received:', response.data.verificationCode);
        setDisplayCode(response.data.verificationCode);
      } else {
        console.warn('No verification code in response:', response.data);
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send verification code';
      setError(errorMessage);
      
      // If email already exists or is verified, mark as success
      if (errorMessage.includes('already') || errorMessage.includes('verified')) {
        setSuccess(true);
        if (onVerified) {
          onVerified({
            email,
            tempToken: sessionStorage.getItem('emailVerificationToken'),
            verified: true
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    // Prevent multiple submissions
    if (success) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/email-verification/verify-code', {
        email,
        code: verificationCode
      });

      console.log('Verification response:', response.data);
      
      // Check if response indicates success
      if (response.data && (response.data.tempToken || response.data.message === 'Email verified successfully')) {
        setSuccess(true);
        setError(''); // Clear any previous errors
        
        // Store the temp token for use during registration
        sessionStorage.setItem('emailVerificationToken', response.data.tempToken);
        sessionStorage.setItem('verifiedEmail', email);
        
        // Call parent callback with verification data
        if (onVerified) {
          onVerified({
            email,
            tempToken: response.data.tempToken,
            verified: true
          });
        }
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Invalid verification code';
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  if (!codeSent) {
    return (
      <div className="email-verification-container">
        <div className="verification-card">
          <h3>Verify Your Email</h3>
          <p>We'll send a verification code to:</p>
          <p className="email-display">{email}</p>
          
          <button 
            className="btn-send-code"
            onClick={sendVerificationCode}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        {!success ? (
          <>
            <h3>Enter Verification Code</h3>
            <p>We've sent a 6-digit code to {email}</p>
            
            {displayCode && (
              <div className="test-code-display">
                <strong>🔍 Test Mode:</strong> Your verification code is <strong className="code-highlight">{displayCode}</strong>
              </div>
            )}
            
            <div className="code-input-container">
              <input
                type="text"
                className="code-input"
                placeholder="000000"
                value={verificationCode}
                onChange={handleCodeChange}
                maxLength="6"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <button 
              className="btn-verify"
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            {!success && (
              <div className="resend-section">
                {resendTimer > 0 ? (
                  <p className="resend-timer">Resend code in {resendTimer}s</p>
                ) : (
                  <button 
                    className="btn-resend"
                    onClick={sendVerificationCode}
                    disabled={loading || success}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </>
        ) : (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h3>Email Verified!</h3>
            <p>Your email has been successfully verified.</p>
            <p className="success-note">You can now proceed with registration.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
