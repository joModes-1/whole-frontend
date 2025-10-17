import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaSave, FaUpload, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';
import './EditProfile.css';

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State for each form section
  const [name, setName] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Loading and error states
  const [loading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false);
  const [pictureUpdateLoading, setPictureUpdateLoading] = useState(false);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);

  // Initialize form data from user context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfileImagePreview(user.profilePicture || '');
    }
  }, [user]);

  // Handle name update
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    
    setNameUpdateLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await api.put('/profile', { name });
      if (updateUser) {
        updateUser(response.data);
      }
      setMessage('Name updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update name. Please try again.');
      console.error('Name update error:', err);
    } finally {
      setNameUpdateLoading(false);
    }
  };

  // Handle profile picture selection
  const handlePictureSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setProfileImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile picture upload
  const handlePictureUpload = async (e) => {
    e.preventDefault();
    
    if (!profileImageFile) {
      setError('Please select an image to upload.');
      return;
    }
    
    setPictureUpdateLoading(true);
    setError('');
    setMessage('');
    
    const formData = new FormData();
    formData.append('profilePicture', profileImageFile);
    
    try {
      const response = await api.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (updateUser) {
        updateUser(response.data);
      }
      setMessage('Profile picture updated successfully!');
      setProfileImageFile(null);
      setProfileImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
      console.error('Picture upload error:', err);
    } finally {
      setPictureUpdateLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setPasswordUpdateLoading(true);
    setError('');
    setMessage('');
    
    try {
      await api.post('/auth/change-password', { newPassword });
      setMessage('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. You may need to log in again to perform this action.');
      console.error('Password change error:', err);
    } finally {
      setPasswordUpdateLoading(false);
    }
  };


  // Handle back navigation
  const handleGoBack = () => {
    navigate('/profile');
  };

  if (!user) return <div className="edit-profile-container">Loading...</div>;

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-card">
        <div className="edit-profile-header">
          <h2>Edit Profile</h2>
          <p>Update your personal information and settings</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        {/* Edit Name Section */}
        <div className="edit-profile-section">
          <div className="section-header">
            <FaUser className="section-icon" />
            <h3>Update Your Name</h3>
          </div>
          <form onSubmit={handleNameUpdate} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your full name"
                className="form-input"
                disabled={nameUpdateLoading}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={nameUpdateLoading || !name}
            >
              {nameUpdateLoading ? (
                <>
                  <span className="spinner"></span> Saving...
                </>
              ) : (
                <>
                  <FaSave className="btn-icon" /> Save Name
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Profile Picture Section */}
        <div className="edit-profile-section">
          <div className="section-header">
            <FaUpload className="section-icon" />
            <h3>Change Profile Picture</h3>
          </div>
          <form onSubmit={handlePictureUpload} className="edit-profile-form">
            <div className="profile-preview-container">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt="Profile preview" 
                  className="profile-preview-image"
                />
              ) : (
                <div className="profile-preview-placeholder">
                  <FaUser className="placeholder-icon" />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="profilePicture">Profile Picture</label>
              <input 
                type="file" 
                id="profilePicture" 
                ref={fileInputRef}
                onChange={handlePictureSelect} 
                accept="image/*" 
                className="form-input"
                disabled={pictureUpdateLoading}
              />
              <p className="form-help-text">Maximum file size: 5MB. Supported formats: JPG, PNG, GIF</p>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={pictureUpdateLoading || !profileImageFile}
            >
              {pictureUpdateLoading ? (
                <>
                  <span className="spinner"></span> Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="btn-icon" /> Upload Picture
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Change Password Section */}
        <div className="edit-profile-section">
          <div className="section-header">
            <FaLock className="section-icon" />
            <h3>Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input 
                type="password" 
                id="newPassword" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password"
                className="form-input"
                disabled={passwordUpdateLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password"
                className="form-input"
                disabled={passwordUpdateLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={passwordUpdateLoading || !newPassword || !confirmPassword}
            >
              {passwordUpdateLoading ? (
                <>
                  <span className="spinner"></span> Changing...
                </>
              ) : (
                <>
                  <FaLock className="btn-icon" /> Change Password
                </>
              )}
            </button>
          </form>
        </div>
        {/* Navigation Buttons */}
        <div className="edit-profile-actions">
          <button 
            onClick={handleGoBack} 
            className="btn-secondary"
            disabled={loading}
          >
            <FaArrowLeft className="btn-icon" /> Back to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
