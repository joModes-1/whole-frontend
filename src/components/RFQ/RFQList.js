import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RFQList = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });

  const categories = ['Electronics', 'Industrial', 'Office Supplies', 'Raw Materials'];
  const statuses = ['pending', 'approved', 'rejected', 'fulfilled'];

  const fetchRFQs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      
      const response = await axios.get(`/api/rfq?${params.toString()}`);
      setRfqs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch RFQs');
      console.error('Error fetching RFQs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  const handleStatusChange = async (rfqId, newStatus) => {
    try {
      await axios.patch(`/api/rfq/${rfqId}/status`, { status: newStatus });
      setRfqs(rfqs.map(rfq => 
        rfq._id === rfqId ? { ...rfq, status: newStatus } : rfq
      ));
    } catch (err) {
      setError('Failed to update RFQ status');
      console.error('Error updating RFQ status:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      fulfilled: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">RFQ List</h1>
        <Link
          to="/rfq/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New RFQ
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* RFQ List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {rfqs.map(rfq => (
            <li key={rfq._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {rfq.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Buyer: {rfq.buyerId.name}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rfq.status)}`}>
                      {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Category: {rfq.category}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      Quantity: {rfq.quantity}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    Budget: ${rfq.budget}
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Link
                    to={`/rfq/${rfq._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                  {rfq.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(rfq._id, 'approved')}
                        className="text-green-600 hover:text-green-800"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(rfq._id, 'rejected')}
                        className="text-red-600 hover:text-red-800"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {rfq.status === 'approved' && (
                    <button
                      onClick={() => handleStatusChange(rfq._id, 'fulfilled')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Mark as Fulfilled
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RFQList; 