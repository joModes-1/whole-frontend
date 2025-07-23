import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserStatus } from '../../services/adminService';
import UserTable from '../../components/admin/UserTable';
import Pagination from '../../components/common/Pagination';
import './UserManagementPage.css';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers(page);
      setUsers(data.users);
      setTotalPages(data.pages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      // Refresh the user list to show the updated status
      fetchUsers();
    } catch (error) {
      setError('Failed to update user status.');
    }
  };

  return (
    <div className="user-management-page">
      <h1>User Management</h1>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && (
        <>
          <UserTable users={users} onStatusUpdate={handleStatusUpdate} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default UserManagementPage;
