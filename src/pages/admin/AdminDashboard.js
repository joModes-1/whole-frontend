import React, { useState, useEffect } from 'react';
import AdminStats from '../../components/admin/AdminStats';
import RecentActivity from '../../components/admin/RecentActivity';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard');
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error('Dashboard fetch error:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}
      {dashboardData && (
        <>
          <AdminStats stats={dashboardData.stats} />
          <div className="mt-6">
            <RecentActivity activities={dashboardData.recentActivities} />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
