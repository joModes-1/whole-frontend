import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { updatePassword } from 'firebase/auth';

const EditProfile = () => {
  const { user, updateUser } = useAuth();

  // State for each form section
  const [name, setName] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for feedback messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await axios.put('/api/profile', { name });
      updateUser(response.data);
      setMessage('Name updated successfully!');
    } catch (err) {
      setError('Failed to update name. Please try again.');
      console.error('Name update error:', err);
    }
  };

  const handlePictureUpload = async (e) => {
    e.preventDefault();
    if (!profileImageFile) {
      setError('Please select an image to upload.');
      return;
    }
    setError('');
    setMessage('');
    const formData = new FormData();
    formData.append('profilePicture', profileImageFile);

    try {
      const response = await axios.post('/api/profile/picture', formData);
      updateUser(response.data.user);
      setMessage('Profile picture updated successfully!');
    } catch (err) {
      setError('Failed to upload profile picture.');
      console.error('Picture upload error:', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await updatePassword(auth.currentUser, newPassword);
      setMessage('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to change password. You may need to log in again to perform this action.');
      console.error('Password change error:', err);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <h2>Edit Profile</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Edit Name Form */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Update Your Name</h5>
          <form onSubmit={handleNameUpdate}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input type="text" className="form-control" id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Save Name</button>
          </form>
        </div>
      </div>

      {/* Upload Profile Picture Form */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Change Profile Picture</h5>
          {user?.profilePicture && (
            <div className="mb-3">
              <img src={user.profilePicture} alt="Current profile" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
            </div>
          )}
          <form onSubmit={handlePictureUpload}>
            <div className="mb-3">
              <label htmlFor="profilePicture" className="form-label">New Profile Picture</label>
              <input type="file" className="form-control" id="profilePicture" onChange={(e) => setProfileImageFile(e.target.files[0])} accept="image/*" />
            </div>
            <button type="submit" className="btn btn-primary">Upload Picture</button>
          </form>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Change Password</h5>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <input type="password" className="form-control" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
