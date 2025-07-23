import React from 'react';
import './TransactionTable.css';

const TransactionTable = ({ transactions }) => {
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  const getTypeClass = (type) => {
    switch (type.toLowerCase()) {
      case 'sale':
        return 'type-sale';
      case 'payout':
        return 'type-payout';
      case 'refund':
        return 'type-refund';
      default:
        return '';
    }
  };

  return (
    <div className="transaction-table-container">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Order ID</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Commission</th>
            <th>Payout</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.orderId}</td>
              <td>
                <span className={`type-badge ${getTypeClass(transaction.type)}`}>
                  {transaction.type}
                </span>
              </td>
              <td>${transaction.amount.toFixed(2)}</td>
              <td>${transaction.commission.toFixed(2)}</td>
              <td>${transaction.payout.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                  {transaction.status}
                </span>
              </td>
              <td>{transaction.date}</td>
              <td>
                <button className="action-btn details-btn">Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
