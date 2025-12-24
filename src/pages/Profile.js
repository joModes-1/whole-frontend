import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile, clearUser, setUser } from '../redux/userSlice';
import { useAuth } from '../context/AuthContext';
import LeafletLocationSelector from '../components/LocationSelector/LeafletLocationSelector';
import api from '../services/api';
import './Profile.css';
import ProfileSkeleton from '../components/Header/ProfileSkeleton';

const Profile = () => {
  const { logout, loading: authLoading, error: authError, updateUser } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.user.data);
  const userStatus = useSelector(state => state.user.status);
  const userError = useSelector(state => state.user.error);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [locationUpdateLoading, setLocationUpdateLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationError, setLocationError] = useState('');
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
    if (fileInputRef.current && !uploading) {
      console.log('Profile image clicked - opening file picker');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Allow selecting the same file again later
    if (event.target) event.target.value = '';

    // Basic client-side validation (matches backend limits)
    const isImage = /^image\//.test(file.type);
    if (!isImage) {
      setUploadError('Please select a valid image file.');
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError('Image is too large. Max size is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    setUploadError('');

    try {
      // Use shared API client (correct baseURL + auth headers + consistent behavior)
      const response = await api.post('/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = response.data?.user || response.data;
      if (updatedUser) {
        dispatch(setUser(updatedUser)); // Update Redux
        if (updateUser) updateUser(updatedUser); // Update AuthContext
        setUploadError('');
      } else {
        setUploadError('Upload succeeded but no user data returned.');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload picture. Please try again.';
      setUploadError(msg);
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

  // Handle opening location map
  const handleOpenLocationMap = () => {
    setLocationError('');
    setLocationMessage('');
    setShowLocationMap(true);
  };

  // Handle location selection from map
  const handleLocationSelect = async (location) => {
    setLocationUpdateLoading(true);
    setLocationMessage('');
    setLocationError('');
    
    try {
      const locationData = {
        businessLocation: {
          formattedAddress: location.formattedAddress || `${location.lat}, ${location.lng}`,
          city: location.city || location.formattedAddress?.split(',')[0] || '',
          country: location.country || 'Uganda',
          coordinates: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          }
        }
      };
      
      const response = await api.put('/profile', locationData);
      const updatedUser = response.data.user || response.data;
      
      if (updatedUser) {
        dispatch(setUser(updatedUser));
        if (updateUser) {
          updateUser(updatedUser);
        }
        setLocationMessage('✓ Location updated successfully!');
        setTimeout(() => setLocationMessage(''), 5000);
        // Also refresh profile to ensure consistency
        dispatch(fetchUserProfile());
      }
      
      setShowLocationMap(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update location. Please try again.';
      setLocationError(errorMsg);
      console.error('Location update error:', err);
      // Don't close the modal on error so user can retry
      setTimeout(() => setLocationError(''), 5000);
    } finally {
      setLocationUpdateLoading(false);
    }
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

  // Construct proper image URL (handle both relative and absolute URLs)
  const getImageUrl = (url) => {
    if (!url) return null;
    // If it's a cloudinary URL or starts with http/https, use as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Otherwise, prepend the backend URL
    return `http://localhost:4000${url.startsWith('/') ? '' : '/'}${url}`;
  };
  
  const profileImageUrl = getImageUrl(user.profilePicture);
  
  // Debug logging
  console.log('Current user data:', user);
  console.log('Profile picture value:', user.profilePicture);
  console.log('Constructed image URL:', profileImageUrl);

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div 
            className="profile-image-container" 
            onClick={handleImageClick}
            style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
            title="Click to change profile picture"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="image/*"
              disabled={uploading}
            />
            {profileImageUrl ? (
              <img
                key={profileImageUrl}
                src={profileImageUrl}
                alt={user.name || 'Profile'}
                className={`profile-image profile-image-small ${uploading ? 'uploading' : ''}`}
                onLoad={() => console.log('Profile image loaded successfully:', profileImageUrl)}
                onError={(e) => {
                  console.error('Profile image failed to load:', profileImageUrl);
                  console.error('Image error:', e);
                }}
              />
            ) : (
              <FaUser className="profile-icon profile-image-small" />
            )}
            {uploading && <div className="spinner-overlay"></div>}
            <div className="edit-overlay">Click to change</div>
          </div>
          <h1 className="profile-name">{user.name}</h1>
          <span className={`profile-role ${user.role || ''}`}>
            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Role not set'}
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
            <p>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Role not set'}</p>
          </div>

          <div className="detail-item">
            <label>Member Since</label>
            <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</p>
          </div>

          {/* Business Location - Only for sellers */}
          {user.role === 'seller' && (
            <div className="detail-item location-item">
              <label>Business Location</label>
              {user.businessLocation && user.businessLocation.formattedAddress ? (
                <div className="business-location-info">
                  <p>{user.businessLocation.formattedAddress}</p>
                  {user.businessLocation.city && (
                    <p className="location-details">
                      {user.businessLocation.city}
                      {user.businessLocation.state && `, ${user.businessLocation.state}`}
                      {user.businessLocation.country && `, ${user.businessLocation.country}`}
                    </p>
                  )}
                  <button
                    className="location-status-button verified"
                    onClick={handleOpenLocationMap}
                    disabled={locationUpdateLoading}
                  >
                    <FaMapMarkerAlt /> Update Location
                  </button>
                </div>
              ) : (
                <div className="business-location-missing">
                  <p>No business location set</p>
                  <button
                    className="location-status-button set-location"
                    onClick={handleOpenLocationMap}
                    disabled={locationUpdateLoading}
                  >
                    <FaMapMarkerAlt /> Set Location Now
                  </button>
                  <span className="location-warning">
                    ⚠️ Location Required for Product Listings
                  </span>
                </div>
              )}
              {locationMessage && (
                <div className="location-success-message">{locationMessage}</div>
              )}
              {locationError && (
                <div className="location-error-message">{locationError}</div>
              )}
            </div>
          )}

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

          {user.role && user.role === 'seller' && (
            <button 
              className="action-button products"
              onClick={handleViewProducts}
            >
              My Products
            </button>
          )}

          {user.role && user.role === 'buyer' && (
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
      
      {/* Location Map Modal */}
      {showLocationMap && (
        <div className="location-map-modal">
          <div className="location-map-container">
            <div className="location-map-header">
              <h3>
                {locationUpdateLoading ? 'Updating Location...' : 'Select Your Business Location'}
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowLocationMap(false)}
                disabled={locationUpdateLoading}
              >
                ×
              </button>
            </div>
            <div className="location-map-body">
              {locationError && (
                <div className="map-error-message">
                  {locationError}
                </div>
              )}
              <LeafletLocationSelector
                initialLocation={user.businessLocation?.coordinates ? {
                  lat: user.businessLocation.coordinates.coordinates[1],
                  lng: user.businessLocation.coordinates.coordinates[0],
                  formattedAddress: user.businessLocation.formattedAddress
                } : null}
                onLocationSelect={handleLocationSelect}
                required={false}
                disabled={locationUpdateLoading}
              />
              {locationUpdateLoading && (
                <div className="location-updating-overlay">
                  <div className="spinner"></div>
                  <p>Saving your location...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 