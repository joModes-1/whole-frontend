import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/orders/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOrder(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order details');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/orders/${id}/status`,
        {
          status: newStatus,
          trackingNumber,
          note
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchOrder();
      setNewStatus('');
      setTrackingNumber('');
      setNote('');
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/orders/${id}/cancel`,
        { note: 'Order cancelled by user' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchOrder();
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order');
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
  if (!order) return <div className="p-4">Order not found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <button
          onClick={() => navigate('/orders')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Order {order.orderNumber}</h1>
              <p className="text-gray-600">
                Placed on {format(new Date(order.createdAt), 'PPP')}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Order Details</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="mb-2">
                  <span className="font-medium">Subtotal:</span> ${order.subtotal.toFixed(2)}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Tax:</span> ${order.tax.toFixed(2)}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Shipping:</span> UGX {order.shippingCost.toFixed(2)}
                </p>
                <p className="text-lg font-bold">
                  Total: UGX {order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Shipping Details</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="mb-2">{order.shippingAddress.street}</p>
                <p className="mb-2">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.trackingNumber && (
                  <p className="mt-2">
                    <span className="font-medium">Tracking:</span> {order.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Items</h2>
            <div className="bg-gray-50 rounded divide-y">
              {order.items.map((item) => (
                <div key={item._id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.listing?.title || item.listing?.name || "Product Name Not Available"}</h3>
                    <p className="text-gray-600">
                      Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {order.statusHistory.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Status History</h2>
              <div className="bg-gray-50 rounded divide-y">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{history.status}</p>
                        {history.note && (
                          <p className="text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">
                        {format(new Date(history.timestamp), 'PPP')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Update Form for Sellers */}
          {order.seller._id === localStorage.getItem('userId') &&
            !['delivered', 'cancelled'].includes(order.status) && (
              <form onSubmit={handleStatusUpdate} className="mt-6 bg-gray-50 p-4 rounded">
                <h2 className="text-lg font-semibold mb-4">Update Order Status</h2>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Select status...</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  {newStatus === 'shipped' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-2 border rounded"
                      rows="2"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            )}

          {/* Cancel Button for Buyers */}
          {order.buyer._id === localStorage.getItem('userId') &&
            ['pending', 'confirmed'].includes(order.status) && (
              <div className="mt-6">
                <button
                  onClick={handleCancel}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Cancel Order
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 