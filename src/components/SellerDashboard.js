import React, { useEffect, useState } from 'react';
import ProductSkeleton from './ProductSkeleton/ProductSkeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import RevenueOverTimeChart from './charts/RevenueOverTimeChart';
import { FaPlus, FaMoneyBillWave, FaShoppingCart, FaChartLine, FaFire } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSellerDashboardStats } from '../redux/sellerDashboardSlice';
import SellerProducts from './SellerProducts';
import './SellerDashboard.css'; 
import api from '../services/api';

const SellerDashboard = () => {
  const dispatch = useDispatch();
  const { user, token } = useAuth();
  const stats = useSelector(state => state.sellerDashboard.stats);
  const status = useSelector(state => state.sellerDashboard.status);
  const error = useSelector(state => state.sellerDashboard.error);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (user && token) {
      dispatch(fetchSellerDashboardStats());
    }
  }, [user, token, dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Note: previously used for badge styling; removed to satisfy lint as we now use a select control

  const handleStatusChange = (orderId, value) => {
    setSelectedStatus(prev => ({ ...prev, [orderId]: value }));
  };

  const updateOrderStatus = async (orderId) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { status: selectedStatus[orderId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh dashboard stats to reflect the change
      dispatch(fetchSellerDashboardStats());
    } catch (e) {
      console.error('Failed to update order status:', e);
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
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

  // Derive delivered-only metrics on the client to ensure correctness even if backend cache/filters lag
  const deliveredCount = stats?.ordersByStatus?.delivered?.count || 0;
  const deliveredRevenue = stats?.ordersByStatus?.delivered?.revenue || 0;
  const deliveredAOV = deliveredCount > 0 ? (deliveredRevenue / deliveredCount) : 0;

  const revenueData = Array.isArray(stats.revenueByMonth)
    ? stats.revenueByMonth.map((item) => {
        const year = item?._id?.year ?? new Date().getFullYear();
        const month = ((item?._id?.month || 1) - 1);
        const label = isFinite(year) && isFinite(month)
          ? format(new Date(year, month), 'MMM yyyy')
          : 'N/A';
        const value = Number(item?.revenue || 0);
        return { name: label, revenue: value };
      })
    : [];

  const revenueDataKey = Array.isArray(stats.revenueByMonth)
    ? stats.revenueByMonth.map((i) => `${i?._id?.year}-${i?._id?.month}-${i?.revenue}`).join('|')
    : String(revenueData.length);

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Seller Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/seller/products/add" className="create-product-link">
            <FaPlus /> Add New Product
          </Link>
          <Link to="/seller/hot-deals/create" className="create-hot-deal-link">
            <FaFire /> Create Hot Deal
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">
            <FaMoneyBillWave className="card-icon revenue" />
            Total Revenue
          </h3>
          <p className="card-value">{formatCurrency(deliveredRevenue)}</p>
        </div>
        <div className="dashboard-card">
          <h3 className="card-title">
            <FaShoppingCart className="card-icon orders" />
            Total Orders
          </h3>
          <p className="card-value">{deliveredCount}</p>
        </div>
        <div className="dashboard-card">
          <h3 className="card-title">
            <FaChartLine className="card-icon value" />
            Average Order Value
          </h3>
          <p className="card-value">{formatCurrency(deliveredAOV)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="dashboard-card-full chart-container">
        <h2 className="section-title">Revenue Over Time</h2>
        {revenueData.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            No revenue data to display yet.
          </div>
        ) : (
          <div key={revenueDataKey}>
            <RevenueOverTimeChart data={revenueData} height={360} formatCurrency={formatCurrency} />
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <h2 className="section-title">Recent Orders</h2>
        <div className="dashboard-card-full">
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={selectedStatus[order._id] || order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="order-status-select"
                        disabled={updating[order._id] || ['cancelled','delivered','refunded'].includes(order.status)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        className="btn btn-primary order-update-btn"
                        disabled={
                          updating[order._id] || (selectedStatus[order._id] || order.status) === order.status || ['cancelled','delivered','refunded'].includes(order.status)
                        }
                        onClick={() => updateOrderStatus(order._id)}
                      >
                        {updating[order._id] ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </td>
                  <td>{format(new Date(order.createdAt), 'PP')}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
