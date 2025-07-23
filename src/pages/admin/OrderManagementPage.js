import React from 'react';
import OrderTable from '../../components/admin/OrderTable';
import './OrderManagementPage.css';

const OrderManagementPage = () => {
  // Mock data for orders
  const mockOrders = [
    {
      id: 'ORD-001',
      customer: 'John Doe',
      seller: 'Tech Gadgets Inc.',
      date: '2023-10-27',
      total: 299.99,
      status: 'Processing',
      payment: 'Paid',
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      seller: 'Fashion Hub',
      date: '2023-10-26',
      total: 150.5,
      status: 'Shipped',
      payment: 'Paid',
    },
    {
      id: 'ORD-003',
      customer: 'Mike Johnson',
      seller: 'Home Essentials',
      date: '2023-10-25',
      total: 75.0,
      status: 'Delivered',
      payment: 'Paid',
    },
    {
      id: 'ORD-004',
      customer: 'Emily Brown',
      seller: 'Tech Gadgets Inc.',
      date: '2023-10-24',
      total: 1200.0,
      status: 'Pending',
      payment: 'Unpaid',
    },
     {
      id: 'ORD-005',
      customer: 'Chris Lee',
      seller: 'Global Imports',
      date: '2023-10-23',
      total: 450.0,
      status: 'Cancelled',
      payment: 'Refunded',
    },
  ];

  return (
    <div className="order-management-page">
      <header className="page-header">
        <h1>Order Management</h1>
        <p>Monitor and manage all customer orders.</p>
      </header>
      <OrderTable orders={mockOrders} />
    </div>
  );
};

export default OrderManagementPage;
