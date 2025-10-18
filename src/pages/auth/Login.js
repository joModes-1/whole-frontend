import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

import { FaEnvelope, FaLock } from 'react-icons/fa';
import './Auth.css';
import PasswordInput from '../../components/common/PasswordInput';
import BackButton from '../../components/common/BackButton';

import { useDispatch } from 'react-redux';
import { fetchUserProfile } from '../../redux/userSlice';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Get the user token
      const idToken = await userCredential.user.getIdToken();

      const idTokenResult = await userCredential.user.getIdTokenResult();
      const roles = idTokenResult.claims.roles || ['buyer'];
      const userRole = roles.includes('seller') ? 'seller' :
                        roles.includes('admin') ? 'admin' : 'buyer';

      // Create user data object
      const userData = {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        role: userRole
      };

      // Login with user data and token
      await login(userData, idToken);
      // Always fetch the latest user profile after login to update Redux
      await dispatch(fetchUserProfile());
      // Redirect based on role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'seller') {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : 'Failed to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleGoogleLogin = (e) => {
  //   setError('');
  //   setLoading(true);
  //   // Call signInWithPopup directly in response to the click event
  //   googleSignIn()
  //     .then(user => {
  //       const from = location.state?.from?.pathname;
  //       if (from) {
  //         navigate(from, { replace: true });
  //       } else if (user.role === 'seller') {
  //         navigate('/seller/dashboard', { replace: true });
  //       } else {
  //         navigate('/', { replace: true });
  //       }
  //     })
  //     .catch(() => {
  //       setError('Failed to login with Google. Please try again.');
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // };

  // Add auth-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <BackButton style={{ marginBottom: 16 }} />
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to continue to your account</p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <div className="input-group">
                <span className="input-icon"><FaEnvelope /></span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <div className="input-group">
                <span className="input-icon"><FaLock /></span>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="forgot-password">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            </div>
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="divider">
              <span>OR</span>
            </div>
            
            
            
            <p className="signup-link">
              Don't have an account? <Link to="/role-selection">Sign up</Link>
            </p>
          </form>
        </div>
        
        <div className="login-graphics">
          <div className="graphics-content">
            <h2>B2B Platform</h2>
            <p>Connecting businesses with quality products and services</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 