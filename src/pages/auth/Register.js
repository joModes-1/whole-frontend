import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import './Auth.css';
import '../SellerOnboarding.css';
import PasswordInput from '../../components/common/PasswordInput';
import LeafletLocationSelector from '../../components/LocationSelector/LeafletLocationSelector';
import { normalizeUgandanPhone, isValidUgandanPhone } from '../../utils/phoneUtils';
// import { RecaptchaVerifier } from 'firebase/auth';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const { googleSignIn } = useAuth(); // Not used currently
  // const [authReady, setAuthReady] = useState(false);
  
  // Get auth instance from Firebase config
  // const auth = firebaseAuth;
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // const recaptchaVerifierRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: '', // Role will be set from the URL
    // Seller-specific fields
    businessName: '',
    businessDescription: '',
    businessCategory: '',
    yearsInBusiness: '',
    businessLocation: null,
    businessPhone: '',
    // Buyer-specific fields
    deliveryAddress: null
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Business categories for sellers
  const businessCategories = [
    'FMCG Wholesaler'
  ];

  // Set role from URL query or navigation state on mount.
  // UX requirement: if no role is present, redirect to '/role-selection'.
  useEffect(() => {
    const roleFromState = location.state?.role;
    const params = new URLSearchParams(location.search);
    const roleFromUrl = params.get('role');
    const role = roleFromState || roleFromUrl;

    if (role !== 'buyer' && role !== 'seller') {
      navigate('/role-selection', { replace: true });
      return;
    }

    setFormData(prev => ({ 
      ...prev, 
      role,
      businessPhone: prev.phoneNumber // Initialize business phone with main phone
    }));
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Sync business phone with main phone number for sellers
      ...(name === 'phoneNumber' && prev.role === 'seller' ? { businessPhone: value } : {})
    }));
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      businessLocation: location
    }));
  };

  const handleDeliveryLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: location
    }));
  };

  // Step validation functions
  const validateStep1 = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Full name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phoneNumber.trim()) {
      errors.push('Phone number is required');
    } else if (!isValidUgandanPhone(formData.phoneNumber)) {
      errors.push('Please enter a valid Ugandan phone number (e.g., 0700000000 or +256700000000)');
    }
    if (!formData.password) errors.push('Password is required');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    if (formData.password.length < 6) errors.push('Password must be at least 6 characters long');
    return errors;
  };

  const validateBuyerLocation = () => {
    const errors = [];
    if (!formData.deliveryAddress) errors.push('Delivery location is required');
    return errors;
  };

  const validateStep2 = () => {
    const errors = [];
    if (!formData.businessName.trim()) errors.push('Business name is required');
    if (!formData.businessCategory) errors.push('Business category is required');
    if (!formData.businessDescription.trim()) errors.push('Business description is required');
    return errors;
  };

  const validateStep3 = () => {
    const errors = [];
    if (!formData.businessLocation) errors.push('Business location is required');
    if (!formData.businessPhone.trim()) {
      errors.push('Business phone number is required');
    } else if (!isValidUgandanPhone(formData.businessPhone)) {
      errors.push('Please enter a valid Ugandan business phone number (e.g., 0700000000 or +256700000000)');
    }
    return errors;
  };

  // Step navigation functions
  const handleStep1Continue = () => {
    const errors = validateStep1();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    setError('');
    // Both buyers and sellers go to step 2
    setCurrentStep(2);
  };

  const handleBuyerLocationContinue = () => {
    const errors = validateBuyerLocation();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    handleSubmit();
  };

  const handleStep2Continue = () => {
    const errors = validateStep2();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    setError('');
    setCurrentStep(3);
  };

  const handleStep3Continue = () => {
    const errors = validateStep3();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    setError('');
    handleSubmit();
  };

  const handleSubmit = async (e = null) => {
    if (e) e.preventDefault();
    
    // Basic validation
    const step1Errors = validateStep1();
    if (step1Errors.length > 0) {
      setError(step1Errors.join(', '));
      return;
    }
    
    // Additional validation based on role
    if (formData.role === 'seller') {
      const step2Errors = validateStep2();
      const step3Errors = validateStep3();
      if (step2Errors.length > 0 || step3Errors.length > 0) {
        setError([...step2Errors, ...step3Errors].join(', '));
        return;
      }
    } else if (formData.role === 'buyer') {
      const locationErrors = validateBuyerLocation();
      if (locationErrors.length > 0) {
        setError(locationErrors.join(', '));
        return;
      }
    }
    
    setIsLoading(true);
    setError('');
    // Log user data before sending to backend
    console.log('[Register] User input data:', formData);
    // Format phone number using normalization function
    const phoneNumber = normalizeUgandanPhone(formData.phoneNumber);
    
    // Format business phone for sellers
    const businessPhone = formData.role === 'seller' 
      ? normalizeUgandanPhone(formData.businessPhone)
      : null;
      
    try {
      console.log('Initiating phone verification...');

      console.log('Sending verification code...');
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
        const verifyData = { 
          ...formData, 
          phoneNumber, 
          role: formData.role,
          ...(formData.role === 'seller' && {
            businessPhone,
            businessInfo: {
              businessName: formData.businessName,
              businessDescription: formData.businessDescription,
              businessCategory: formData.businessCategory,
              yearsInBusiness: formData.yearsInBusiness
            },
            businessLocation: formData.businessLocation
          }),
          ...(formData.role === 'buyer' && {
            deliveryAddress: formData.deliveryAddress
          })
        };
        localStorage.setItem('verifyPhoneFormData', JSON.stringify(verifyData));
        navigate('/verify-phone');
      } catch (verificationError) {
        console.error('Verification error:', verificationError);
        setError(verificationError.message || 'Failed to send verification code.');
        setIsLoading(false);
        return;
      }
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

  // const handleGoogleLogin = (e) => {
  //   e.preventDefault();
  //   setError('');
  //   setIsLoading(true);
  //   
  //   // Call signInWithPopup directly in response to the click event
  //   googleSignIn(formData.role)
  //     .then(user => {
  //       console.log('Google sign-in successful:', user);
  //       console.log('User role from backend:', user.role);
  //       console.log('Expected role from form:', formData.role);
  //       
  //       // Navigate directly based on role - no need to login again
  //       if (user.role === 'seller') {
  //         console.log('Navigating to seller dashboard');
  //         navigate('/seller/dashboard', { replace: true });
  //       } else if (user.role === 'buyer') {
  //         console.log('Navigating to home page for buyer');
  //         navigate('/', { replace: true });
  //       } else {
  //         console.log('Unknown role, navigating to home page');
  //         navigate('/', { replace: true });
  //       }
  //     })
  //     .catch((error) => {
  //       console.error('Google sign-in error:', error);
  //       setError('Failed to sign up with Google. Please try again.');
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //     });
  // };


  return (
    <div className="auth-container">
      <div className={formData.role === 'seller' ? "seller-onboarding-card" : "auth-card"}>
        {formData.role === 'seller' ? (
          <div className="onboarding-header">
            <h2>Create Your Seller Account</h2>
            <p>Let's set up your business profile to get you started</p>
            
            {/* Progress indicator for sellers */}
            <div className="progress-indicator">
              <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Account Info</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Business Info</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Location</span>
              </div>
            </div>
          </div>
        ) : formData.role === 'buyer' ? (
          <div className="onboarding-header">
            <h2>Create Your Buyer Account</h2>
            <p>Let's set up your account and delivery location</p>
            
            {/* Progress indicator for buyers */}
            <div className="progress-indicator">
              <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Account Info</span>
              </div>
              <div className="progress-line"></div>
              <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Location</span>
              </div>
            </div>
          </div>
        ) : (
          <h2>Create Account</h2>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Step 1: Basic Account Information */}
        {currentStep === 1 && (
          <div className="onboarding-step">
            {formData.role === 'seller' && <h3>Account Information</h3>}
            
            <form onSubmit={(e) => { e.preventDefault(); handleStep1Continue(); }}>
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  placeholder="0700000000 or +256700000000"
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className={formData.role === 'seller' ? "continue-button" : "auth-button"} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Business Information (Sellers Only) */}
        {currentStep === 2 && formData.role === 'seller' && (
          <div className="onboarding-step">
            <h3>Tell us about your business</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleStep2Continue(); }}>
              <div className="form-group">
                <label htmlFor="businessName">
                  Business Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="businessCategory">
                  Business Category <span className="required">*</span>
                </label>
                <select
                  id="businessCategory"
                  name="businessCategory"
                  value={formData.businessCategory}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select a category</option>
                  {businessCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="businessDescription">
                  Business Description <span className="required">*</span>
                </label>
                <textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  placeholder="Describe what your business does..."
                  rows="4"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="yearsInBusiness">Years in Business</label>
                <select
                  id="yearsInBusiness"
                  name="yearsInBusiness"
                  value={formData.yearsInBusiness}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Select</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="6-10 years">6-10 years</option>
                  <option value="More than 10 years">More than 10 years</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="back-button"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button type="submit" className="continue-button" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Location (Sellers Only) */}
        {currentStep === 3 && formData.role === 'seller' && (
          <div className="onboarding-step">
            <h3>Set Your Business Location</h3>
            <p className="step-description">
              Pick your exact business location. This helps buyers find you and enables accurate delivery calculations.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleStep3Continue(); }}>
              <div className="form-group">
                <label>
                  Business Location <span className="required">*</span>
                </label>
                <LeafletLocationSelector
                  onLocationSelect={handleLocationSelect}
                  initialLocation={formData.businessLocation}
                  required={true}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="businessPhone">Business Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  required
                  placeholder="0700000000 or +256700000000"
                  disabled={isLoading}
                />
                <p className="input-hint">Customers will use this number to contact your business</p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="back-button"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button type="submit" className="complete-button" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Location Information (Buyers Only) */}
        {currentStep === 2 && formData.role === 'buyer' && (
          <div className="onboarding-step">
            <h3>Where should we deliver your orders?</h3>
            <p className="step-description">
              Set your default delivery location for accurate shipping costs and delivery times.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleBuyerLocationContinue(); }}>
              <div className="form-group">
                <label>
                  Delivery Location <span className="required">*</span>
                </label>
                <LeafletLocationSelector
                  onLocationSelect={handleDeliveryLocationSelect}
                  initialLocation={formData.deliveryAddress}
                  required={true}
                  disabled={isLoading}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="back-button"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button type="submit" className="complete-button" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* reCAPTCHA container - will be invisible */}
        <div id="recaptcha-container"></div>

        {currentStep === 1 && (
          <>
            <div className="or-separator">OR</div>
            
          </>
        )}

        <div className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
        <div className="auth-link" style={{ marginTop: '10px' }}>
          <Link to="/role-selection">Back to role selection</Link>
        </div>
        
        {formData.role === 'seller' && (
          <div className="onboarding-footer">
            <p>
              Need help? <a href="/help-center">Visit our Help Center</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
