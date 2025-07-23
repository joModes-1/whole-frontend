import React, { useEffect } from 'react';
import ProductSkeleton from './ProductSkeleton/ProductSkeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSellerDashboardStats } from '../redux/sellerDashboardSlice';
import SellerProducts from './SellerProducts';
import './SellerDashboard.css'; 

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const { user, token } = useAuth();
  const stats = useSelector(state => state.sellerDashboard.stats);
  const status = useSelector(state => state.sellerDashboard.status);
  const error = useSelector(state => state.sellerDashboard.error);

  useEffect(() => {
    if (user && token && status === 'idle') {
      dispatch(fetchSellerDashboardStats());
    }
  }, [user, token, status, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'shipped': return 'status-shipped';
      case 'processing': return 'status-processing';
      default: return 'status-default';
    }
  };

  if (status === 'loading') return (
    <div className="dashboard-skeletons" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: '32px 0' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ flex: '1 1 200px', minWidth: 240 }}>
          <ProductSkeleton />
        </div>
      ))}
    </div>
  );
  if (status === 'failed') return <div className="error-message">{error}</div>;
  if (!stats) return <div className="status-message">No dashboard data available.</div>;

  const revenueData = stats.revenueByMonth.map(item => ({
    name: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
    revenue: item.revenue,
  }));

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Seller Dashboard</h1>
        <Link to="/seller/products/add" className="create-product-link">
          + Add New Product
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">Total Revenue</h3>
          <p className="card-value">{formatCurrency(stats.totals.totalRevenue)}</p>
        </div>
        <div className="dashboard-card">
          <h3 className="card-title">Total Orders</h3>
          <p className="card-value">{stats.totals.totalOrders}</p>
        </div>
        <div className="dashboard-card">
          <h3 className="card-title">Average Order Value</h3>
          <p className="card-value">{formatCurrency(stats.totals.averageOrderValue)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="dashboard-card chart-container">
        <h2 className="section-title">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="var(--accent-primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <h2 className="section-title">Recent Orders</h2>
        <div className="dashboard-card">
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.buyer?.name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{format(new Date(order.createdAt), 'PP')}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* View All Orders Button */}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Link to="/seller/orders" className="btn btn-primary">
              View All Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Product Listings Section */}
      <div className="dashboard-section">
        <h2 className="section-title">My Product Listings</h2>
        <div className="dashboard-card">
          <SellerProducts />
        </div>
      </div>

    </div>
  );
};

export default SellerDashboard;
