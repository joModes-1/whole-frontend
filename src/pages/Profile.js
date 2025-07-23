import React, { useState, useEffect, useRef } from 'react';
import { FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile, clearUser, setUser } from '../redux/userSlice';
import { useAuth } from '../context/AuthContext';
import './Profile.css';
import ProfileSkeleton from '../components/Header/ProfileSkeleton';

const Profile = () => {
  const { logout, loading: authLoading, error: authError } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.user.data);
  const userStatus = useSelector(state => state.user.status);
  const userError = useSelector(state => state.user.error);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fileInputRef = useRef(null);

  // Always fetch user profile when user ID changes (prevents stale data after login/logout)
  useEffect(() => {
    if (userStatus === 'idle' || !user || !user._id) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user?._id, userStatus, user]);

  // This effect handles the logout process once `isLoggingOut` is true.
  useEffect(() => {
    if (isLoggingOut) {
      const performLogout = async () => {
        try {
          await logout(); // Clear user from context
          dispatch(clearUser()); // Clear user from Redux
          navigate('/login'); // Redirect
        } catch (err) {
          console.error('Logout error:', err);
          setError('Failed to logout. Please try again.');
          setIsLoggingOut(false); // Reset on error so user can try again
        }
      };
      performLogout();
    }
  }, [isLoggingOut, logout, dispatch, navigate]);

  const handleLogout = () => {
    // This simply triggers the useEffect hook to start the logout process.
    setIsLoggingOut(true);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    setUploadError('');

    try {
      // Use fetch instead of api to avoid the missing import, or re-import api if you prefer
      const response = await fetch(process.env.REACT_APP_API_BASE_URL ||'http://localhost:4000/api/profile/picture', {
        method: 'POST',
        body: formData,
        headers: {
          // 'Content-Type' should NOT be set when sending FormData
        },
        credentials: 'include', // if your backend needs cookies/auth
      });
      const data = await response.json();
      if (response.ok && data.user) {
        dispatch(setUser(data.user));
      } else {
        setUploadError(data.message || 'Failed to upload picture. Please try again.');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setUploadError('Failed to upload picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };


  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleViewProducts = () => {
    navigate('/seller/products');
  };

  const handleViewOrders = () => {
    navigate('/buyer/orders');
  };

  if (authLoading || isLoggingOut || userStatus === 'loading') {
    return (
      <div className="profile-container">
        {isLoggingOut ? (
          <div className="loading-spinner">Logging out...</div>
        ) : (
          <ProfileSkeleton />
        )}
      </div>
    );
  }

  const displayError = error || authError || userError || uploadError;
  if (displayError && !uploadError) { // Don't show full page error for upload errors
    return (
      <div className="profile-container">
        <div className="error-message">{displayError}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="error-message">User not found</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-image-container" onClick={handleImageClick}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*"
              disabled={uploading}
            />
            {user.profilePicture ? (
  <img
    src={process.env.REACT_APP_API_BASE_URL ||`http://localhost:4000/api/${user.profilePicture}`}
    alt={user.name}
    className={`profile-image profile-image-small ${uploading ? 'uploading' : ''}`}
  />
) : (
  <FaUser className="profile-icon profile-image-small" />
)}
{uploading && <div className="spinner-overlay"></div>}
<div className="edit-overlay">Click to change</div>
          </div>
          <h1 className="profile-name">{user.name}</h1>
          <span className={`profile-role ${user.role}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          {uploadError && <div className="upload-error-message">{uploadError}</div>}
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <label>Email</label>
            <p>{user.email}</p>
          </div>

          <div className="detail-item">
            <label>Role</label>
            <p>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>
          
          <div className="detail-item">
            <label>Company</label>
            <p>{user.companyName || 'Not specified'}</p>
          </div>

          <div className="detail-item">
            <label>Member Since</label>
            <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</p>
          </div>

          {user.address && (
            <div className="detail-item">
              <label>Address</label>
              <p>
                {user.address.street && `${user.address.street}, `}
                {user.address.city && `${user.address.city}, `}
                {user.address.state && `${user.address.state}, `}
                {user.address.country && `${user.address.country}`}
                {user.address.zipCode && ` ${user.address.zipCode}`}
              </p>
            </div>
          )}

          {user.contactNumber && (
            <div className="detail-item">
              <label>Contact Number</label>
              <p>{user.contactNumber}</p>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button 
            className="action-button edit"
            onClick={handleEditProfile}
          >
            Edit Profile
          </button> 

          {user.role === 'seller' && (
            <button 
              className="action-button products"
              onClick={handleViewProducts}
            >
              My Products
            </button>
          )}

          {user.role === 'buyer' && (
            <button 
              className="action-button orders"
              onClick={handleViewOrders}
            >
              My Orders
            </button>
          )}

          <button 
            className="action-button logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 