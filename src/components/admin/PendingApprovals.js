import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const PendingApprovals = () => {
  const [pendingData, setPendingData] = useState({
    sellers: [],
    products: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sellers');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/admin/pending`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPendingData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setError('Failed to load pending approvals');
      setLoading(false);
    }
  };

  const handleSellerAction = async (sellerId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this seller?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/admin/sellers/${sellerId}/status`,
        {
          status: action === 'approve' ? 'active' : 'rejected'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error updating seller status:', error);
      setError('Failed to update seller status');
    }
  };

  const handleProductAction = async (productId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this product?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/admin/products/${productId}/status`,
        {
          status: action === 'approve' ? 'active' : 'rejected'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error updating product status:', error);
      setError('Failed to update product status');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`${
              activeTab === 'sellers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
          >
            Sellers ({pendingData.sellers.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
          >
            Products ({pendingData.products.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {activeTab === 'sellers' ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingData.sellers.map((seller) => (
                <tr key={seller._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {seller.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {seller.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {seller.businessName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {seller.businessType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(seller.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="space-x-2">
                      <button
                        onClick={() => handleSellerAction(seller._id, 'approve')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSellerAction(seller._id, 'reject')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingData.products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.seller?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    UGX {product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(product.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="space-x-2">
                      <button
                        onClick={() =>
                          handleProductAction(product._id, 'approve')
                        }
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleProductAction(product._id, 'reject')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals; 