import React from 'react';
import './AnalyticsPage.css';
import { FaUsers, FaBoxOpen, FaShoppingCart, FaDollarSign } from 'react-icons/fa';

// These are placeholder components. We will create them later.
const LineChart = () => <div className="chart-placeholder">Line Chart Placeholder</div>;
const BarChart = () => <div className="chart-placeholder">Bar Chart Placeholder</div>;
const DoughnutChart = () => <div className="chart-placeholder">Doughnut Chart Placeholder</div>;

const AnalyticsPage = () => {
  const stats = [
    {
      icon: <FaUsers />,
      title: 'Total Users',
      value: '1,250',
      change: '+5.4%',
      changeType: 'increase',
    },
    {
      icon: <FaBoxOpen />,
      title: 'Total Products',
      value: '8,420',
      change: '+12.1%',
      changeType: 'increase',
    },
    {
      icon: <FaShoppingCart />,
      title: 'Total Orders',
      value: '4,860',
      change: '-2.3%',
      changeType: 'decrease',
    },
    {
      icon: <FaDollarSign />,
      title: 'Total Revenue',
      value: '$1.2M',
      change: '+15.8%',
      changeType: 'increase',
    },
  ];

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>Analytics & Insights</h1>
        <p>Monitor key metrics and track performance.</p>
      </header>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h4>{stat.title}</h4>
              <p>{stat.value}</p>
              <span className={`change ${stat.changeType}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Sales Over Time</h3>
          <LineChart />
        </div>
        <div className="chart-card">
          <h3>Top Selling Products</h3>
          <BarChart />
        </div>
        <div className="chart-card">
          <h3>Order Status Distribution</h3>
          <DoughnutChart />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
