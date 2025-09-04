import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('buyer'); // 'buyer' or 'seller'

  useEffect(() => {
    fetchOrders();
  }, [view]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/orders/${view}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex rounded-md shadow-sm" role="group">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              view === 'buyer'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border rounded-l-lg`}
            onClick={() => setView('buyer')}
          >
            My Orders
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              view === 'seller'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border rounded-r-lg`}
            onClick={() => setView('seller')}
          >
            Received Orders
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {view === 'buyer' ? 'Seller' : 'Buyer'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {view === 'buyer'
                    ? order.vendor.name
                    : order.buyer.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  UGX {order.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(order.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No orders found.
        </div>
      )}
    </div>
  );
};

export default Orders; 