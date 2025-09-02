import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OrderTable from '../../components/admin/OrderTable';
import './OrderManagementPage.css';

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/orders/admin/all`
        );

        const ordersData = response.data?.orders || [];
        
        // Transform backend data to match admin table format
        const transformedOrders = ordersData.map(order => ({
          id: order._id || order.id,
          customer: order.buyerName || order.buyer?.name || 'Unknown Customer',
          seller: order.sellerName || order.seller?.name || 'Unknown Seller',
          date: new Date(order.createdAt).toLocaleDateString(),
          total: order.totalAmount || order.total || 0,
          status: order.status || 'Unknown',
          payment: order.paymentStatus || 'Unknown',
          items: order.items || []
        }));

        setOrders(transformedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching admin orders:', err);
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="order-management-page">
        <header className="page-header">
          <h1>Order Management</h1>
          <p>Monitor and manage all customer orders.</p>
        </header>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-management-page">
        <header className="page-header">
          <h1>Order Management</h1>
          <p>Monitor and manage all customer orders.</p>
        </header>
        <div className="error-message" style={{ margin: '2rem' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="order-management-page">
      <header className="page-header">
        <h1>Order Management</h1>
        <p>Monitor and manage all customer orders.</p>
      </header>
      <OrderTable orders={orders} />
    </div>
  );
};

export default OrderManagementPage;
