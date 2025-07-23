import React from 'react';
import TransactionTable from '../../components/admin/TransactionTable';
import './FinancePage.css';

const FinancePage = () => {
  // Mock data for transactions
  const mockTransactions = [
    {
      id: 'TRN-001',
      orderId: 'ORD-001',
      type: 'Sale',
      amount: 299.99,
      commission: 29.99,
      payout: 270.0,
      status: 'Completed',
      date: '2023-10-27',
    },
    {
      id: 'TRN-002',
      orderId: 'ORD-002',
      type: 'Sale',
      amount: 150.5,
      commission: 15.05,
      payout: 135.45,
      status: 'Completed',
      date: '2023-10-26',
    },
    {
      id: 'TRN-003',
      orderId: 'ORD-003',
      type: 'Sale',
      amount: 75.0,
      commission: 7.5,
      payout: 67.5,
      status: 'Completed',
      date: '2023-10-25',
    },
    {
      id: 'TRN-004',
      orderId: 'ORD-004',
      type: 'Payout',
      amount: -500.0,
      commission: 0,
      payout: -500.0,
      status: 'Pending',
      date: '2023-10-24',
    },
    {
      id: 'TRN-005',
      orderId: 'ORD-005',
      type: 'Refund',
      amount: -450.0,
      commission: -45.0,
      payout: -405.0,
      status: 'Completed',
      date: '2023-10-23',
    },
  ];

  return (
    <div className="finance-page">
      <header className="page-header">
        <h1>Finance & Payments</h1>
        <p>Monitor all transactions, payouts, and commissions.</p>
      </header>
      <TransactionTable transactions={mockTransactions} />
    </div>
  );
};

export default FinancePage;
