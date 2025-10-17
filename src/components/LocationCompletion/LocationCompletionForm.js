import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LeafletLocationSelector from '../LocationSelector/LeafletLocationSelector';
import { API_BASE_URL } from '../../config';
import './LocationCompletionForm.css';

const LocationCompletionForm = ({ 
  onComplete, 
  onCancel, 
  missingFields = [], 
  title = "Complete Your Business Information" 
}) => {
  const { user, token, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    phoneNumber: user?.phoneNumber || '',
    businessLocation: user?.businessLocation || null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const needsPhone = missingFields.includes('phoneNumber') || !user?.phoneNumber;
  const needsLocation = missingFields.includes('businessLocation') || !user?.businessLocation?.formattedAddress;

  const handlePhoneChange = (e) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: e.target.value
    }));
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      businessLocation: location
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (needsPhone && !formData.phoneNumber.trim()) {
      errors.push('Phone number is required');
    }
    
    if (needsPhone && formData.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    if (needsLocation && !formData.businessLocation) {
      errors.push('Business location is required');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const updateData = {};
      
      if (needsPhone && formData.phoneNumber) {
        updateData.phoneNumber = formData.phoneNumber.startsWith('+') 
          ? formData.phoneNumber 
          : `+${formData.phoneNumber}`;
      }
      
      if (needsLocation && formData.businessLocation) {
        updateData.businessLocation = formData.businessLocation;
      }
      
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update user context
      if (updateUser) {
        updateUser(data.user);
      }
      
      setSuccess('Business information updated successfully!');
      
      // Call onComplete after a short delay to show success message
      setTimeout(() => {
        onComplete(data.user);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating business information:', err);
      setError(err.message || 'Failed to update business information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="location-completion-overlay">
      <div className="location-completion-form">
        <div className="form-header">
          <h2>{title}</h2>
          <p>
            To ensure the best experience for your customers and enable delivery services, 
            please complete the following required information:
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {needsPhone && (
            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="+254700000000"
                required
                disabled={loading}
                className="form-input"
              />
              <p className="helper-text">
                Your phone number is required for order notifications and customer contact
              </p>
            </div>
          )}

          {needsLocation && (
            <div className="form-group">
              <label>
                Business Location <span className="required">*</span>
              </label>
              <LeafletLocationSelector
                onLocationSelect={handleLocationSelect}
                initialLocation={formData.businessLocation}
                required={true}
                disabled={loading}
              />
              <p className="helper-text">
                Your business location helps customers find you and enables accurate delivery calculations
              </p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Complete Setup'}
            </button>
          </div>
        </form>

        <div className="form-footer">
          <div className="verification-note">
            <h4>Why do we need this information?</h4>
            <ul>
              <li><strong>Delivery Services:</strong> Calculate accurate shipping costs and delivery times</li>
              <li><strong>Trust & Verification:</strong> Build customer confidence with verified business information</li>
              <li><strong>Local Discovery:</strong> Help nearby customers find your products</li>
              <li><strong>Customer Support:</strong> Enable direct communication for order inquiries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCompletionForm;
