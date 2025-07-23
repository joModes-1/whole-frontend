import React from 'react';
import DeliveryTable from '../../components/admin/DeliveryTable';
import './DeliveryManagementPage.css';

const DeliveryManagementPage = () => {
  // Mock data for deliveries
  const mockDeliveries = [
    {
      id: 'DEL-001',
      orderId: 'ORD-001',
      agent: 'John Smith',
      status: 'In Transit',
      location: 'New York, NY',
      lastUpdate: '2023-10-27 10:30 AM',
    },
    {
      id: 'DEL-002',
      orderId: 'ORD-002',
      agent: 'Jane Doe',
      status: 'Out for Delivery',
      location: 'Los Angeles, CA',
      lastUpdate: '2023-10-27 09:15 AM',
    },
    {
      id: 'DEL-003',
      orderId: 'ORD-003',
      agent: 'Mike Brown',
      status: 'Delivered',
      location: 'Chicago, IL',
      lastUpdate: '2023-10-26 03:45 PM',
    },
    {
      id: 'DEL-004',
      orderId: 'ORD-004',
      agent: 'Emily White',
      status: 'Delayed',
      location: 'Houston, TX',
      lastUpdate: '2023-10-27 11:00 AM',
    },
      {
      id: 'DEL-005',
      orderId: 'ORD-005',
      agent: 'Chris Green',
      status: 'Returned',
      location: 'Phoenix, AZ',
      lastUpdate: '2023-10-25 08:00 AM',
    },
  ];

  return (
    <div className="delivery-management-page">
      <header className="page-header">
        <h1>Delivery & Logistics</h1>
        <p>Monitor and manage all ongoing and completed deliveries.</p>
      </header>
      <DeliveryTable deliveries={mockDeliveries} />
    </div>
  );
};

export default DeliveryManagementPage;
