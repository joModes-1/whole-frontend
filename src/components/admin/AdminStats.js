import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AdminStats.css';

// Using the new CSS classes for a cleaner, more maintainable component
const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const AdminStats = ({ stats }) => {
  if (!stats) return <div className="loading">Loading stats...</div>;

  const revenueData = [
    { name: 'Daily', revenue: stats.revenue.daily },
    { name: 'Weekly', revenue: stats.revenue.weekly },
    { name: 'Monthly', revenue: stats.revenue.monthly },
  ];

  const topSellersData = stats.topVendors.map(v => ({ ...v.vendorDetails, ...v }));

  const userTypeData = [
    { name: 'Users', value: stats.users },
    { name: 'Sellers', value: stats.vendors },
  ];

  const orderStatusData = [
    { name: 'Pending', value: stats.orders.pending },
    { name: 'Processing', value: stats.orders.processing },
    { name: 'Delivered', value: stats.orders.delivered },
  ];

  // Using the brand's blue color scheme for all charts
  const BRAND_COLORS = ['#0264f1', '#014aab', '#0275d8', '#569de8', '#8cbcf2'];

  return (
    <div className="admin-stats-container">
      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard title="Total Revenue" value={`$${stats.revenue.total.toLocaleString()}`} icon={<i className="fas fa-dollar-sign"></i>} />
        <StatCard title="Total Users" value={stats.users} icon={<i className="fas fa-users"></i>} />
        <StatCard title="Total Sellers" value={stats.vendors} icon={<i className="fas fa-store"></i>} />
        <StatCard title="Total Products" value={stats.products} icon={<i className="fas fa-box"></i>} />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#0264f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>User Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={userTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#0264f1" label>
                {userTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Top 5 Sellers by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellersData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalRevenue" fill="#014aab" name="Total Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Order Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#0275d8" label>
                {orderStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={BRAND_COLORS.slice(2)[index % (BRAND_COLORS.length - 2)]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminStats; 