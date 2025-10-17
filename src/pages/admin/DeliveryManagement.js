import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlusCircle, FiToggleLeft, FiToggleRight, FiTruck } from 'react-icons/fi';
import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const DeliveryManagement = () => {
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    vehicleType: 'motorcycle',
    vehicleNumber: '',
    licenseNumber: '',
    zone: ''
  });
  const [generatedPassword, setGeneratedPassword] = useState(null);  // Track generated password

  useEffect(() => {
    fetchDeliveryPersonnel();
  }, []);

  const fetchDeliveryPersonnel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/delivery-personnel`);
      setDeliveryPersonnel(response.data.deliveryPersonnel);
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      toast.error('Failed to fetch delivery personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingId && !formData.password) {
      toast.error('Password is required for new delivery personnel');
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        
        await axios.put(`${API_URL}/admin/delivery-personnel/${editingId}`, updateData);
        toast.success('Delivery personnel updated successfully');
      } else {
        // Create new
        const createData = { ...formData };
        let tempPassword = null;
        
        // If no password provided, generate a default one
        if (!createData.password) {
          tempPassword = `Pass${Date.now().toString().slice(-6)}!`;
          createData.password = tempPassword;
        }
        
        await axios.post(`${API_URL}/admin/delivery-personnel`, createData);
        
        // Show success with password info
        if (tempPassword) {
          toast.success(
            <div>
              <strong>Delivery personnel created!</strong><br/>
              <span>Email: {createData.email}</span><br/>
              <span>Generated Password: <strong>{tempPassword}</strong></span><br/>
              <small style={{ color: '#ff6b6b' }}>⚠️ Save this password - it won't be shown again!</small>
            </div>,
            { duration: 15000 }  // Show for 15 seconds
          );
        } else {
          toast.success(
            <div>
              <strong>Delivery personnel created!</strong><br/>
              <span>Email: {createData.email}</span><br/>
              <span>Password: {createData.password}</span>
            </div>,
            { duration: 8000 }
          );
        }
      }
      
      // Reset form and refresh list
      resetForm();
      fetchDeliveryPersonnel();
    } catch (error) {
      console.error('Error saving delivery personnel:', error);
      toast.error(error.response?.data?.message || 'Failed to save delivery personnel');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await axios.delete(`${API_URL}/admin/delivery-personnel/${id}`);
        toast.success('Delivery personnel deleted successfully');
        fetchDeliveryPersonnel();
      } catch (error) {
        console.error('Error deleting delivery personnel:', error);
        toast.error('Failed to delete delivery personnel');
      }
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/admin/delivery-personnel/${id}/toggle-availability`);
      toast.success(response.data.message);
      fetchDeliveryPersonnel();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to toggle availability');
    }
  };

  const handleEdit = (person) => {
    setFormData({
      name: person.name,
      email: person.email,
      password: '', // Don't show existing password
      phoneNumber: person.phoneNumber,
      vehicleType: person.deliveryInfo?.vehicleType || 'motorcycle',
      vehicleNumber: person.deliveryInfo?.vehicleNumber || '',
      licenseNumber: person.deliveryInfo?.licenseNumber || '',
      zone: person.deliveryInfo?.zone || ''
    });
    setEditingId(person._id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      vehicleType: 'motorcycle',
      vehicleNumber: '',
      licenseNumber: '',
      zone: ''
    });
    setEditingId(null);
    setShowAddForm(false);
    setGeneratedPassword(null);
  };

  const getVehicleIcon = (type) => {
    const icons = {
      motorcycle: '🏍️',
      car: '🚗',
      van: '🚐',
      truck: '🚚',
      bicycle: '🚴',
      walking: '🚶'
    };
    return icons[type] || '🚚';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading delivery personnel...</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2><FiTruck /> Delivery Personnel Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <FiPlusCircle /> {showAddForm ? 'Cancel' : 'Add New Delivery Personnel'}
        </button>
      </div>

      {showAddForm && (
        <div className="form-card">
          <h3>{editingId ? 'Edit' : 'Add New'} Delivery Personnel</h3>
          <form onSubmit={handleSubmit} className="delivery-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  disabled={editingId} // Don't allow email change when editing
                />
              </div>

              <div className="form-group">
                <label>Password {!editingId && '(optional - auto-generated if blank)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? 'Leave blank to keep unchanged' : 'Leave blank for auto-generated'}
                />
                {!editingId && (
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    If left blank, a password will be auto-generated and shown after creation
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+256700000000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="walking">Walking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Vehicle Number</label>
                <input
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  placeholder="e.g., UBD 123X"
                />
              </div>

              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="DL-2024-001"
                />
              </div>

              <div className="form-group">
                <label>Assigned Zone</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="e.g., Kampala Central"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Create'} Delivery Personnel
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="delivery-list">
        <h3>Delivery Personnel List ({deliveryPersonnel.length})</h3>
        
        {deliveryPersonnel.length === 0 ? (
          <div className="empty-state">
            <FiTruck size={48} />
            <p>No delivery personnel found</p>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              Add Your First Delivery Personnel
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>Vehicle #</th>
                  <th>Zone</th>
                  <th>Deliveries</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryPersonnel.map((person) => (
                  <tr key={person._id}>
                    <td>
                      <strong>{person.name}</strong>
                    </td>
                    <td>{person.email}</td>
                    <td>{person.phoneNumber}</td>
                    <td>
                      <span className="vehicle-badge">
                        {getVehicleIcon(person.deliveryInfo?.vehicleType)} {person.deliveryInfo?.vehicleType || 'N/A'}
                      </span>
                    </td>
                    <td>{person.deliveryInfo?.vehicleNumber || 'N/A'}</td>
                    <td>{person.deliveryInfo?.zone || 'Not Assigned'}</td>
                    <td>{person.deliveryInfo?.completedDeliveries || 0}</td>
                    <td>
                      <span className="rating">
                        ⭐ {person.deliveryInfo?.rating?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${person.deliveryInfo?.isAvailable ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleAvailability(person._id)}
                      >
                        {person.deliveryInfo?.isAvailable ? (
                          <>
                            <FiToggleRight /> Available
                          </>
                        ) : (
                          <>
                            <FiToggleLeft /> Unavailable
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon edit"
                          onClick={() => handleEdit(person)}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(person._id, person.name)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-section {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 24px;
          color: #333;
        }

        .form-card {
          background: white;
          border-radius: 8px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }

        .form-group input,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #4CAF50;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s;
        }

        .btn-primary {
          background: #4CAF50;
          color: white;
        }

        .btn-primary:hover {
          background: #45a049;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .delivery-list {
          background: white;
          border-radius: 8px;
          padding: 25px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .delivery-list h3 {
          margin-bottom: 20px;
          color: #333;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .empty-state svg {
          color: #ddd;
          margin-bottom: 20px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 2px solid #dee2e6;
        }

        .admin-table td {
          padding: 12px;
          border-bottom: 1px solid #dee2e6;
        }

        .admin-table tr:hover {
          background: #f8f9fa;
        }

        .vehicle-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          background: #e3f2fd;
          border-radius: 4px;
          font-size: 13px;
          color: #1976d2;
        }

        .rating {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .status-toggle {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }

        .status-toggle.active {
          background: #d4edda;
          color: #155724;
        }

        .status-toggle.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .btn-icon.edit {
          color: #1976d2;
        }

        .btn-icon.edit:hover {
          background: #e3f2fd;
        }

        .btn-icon.delete {
          color: #d32f2f;
        }

        .btn-icon.delete:hover {
          background: #ffebee;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4CAF50;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            gap: 15px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .admin-table {
            font-size: 14px;
          }

          .admin-table th,
          .admin-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryManagement;
