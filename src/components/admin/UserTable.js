import React from 'react';
import './UserTable.css';

const UserTable = ({ users, onStatusUpdate }) => {
  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td><span className="user-name">{user.name}</span></td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <span className={`status-badge status-${user.status}`}>
                  {user.status}
                </span>
              </td>
              <td>
                {user.status === 'active' ? (
                  <button
                    onClick={() => onStatusUpdate(user._id, 'deactivated')}
                    className="action-button deactivate"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusUpdate(user._id, 'active')}
                    className="action-button activate"
                  >
                    Activate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
