import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/invoices/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInvoice(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice');
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/invoices/${id}/send`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
      setError('Failed to send invoice');
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setPaymentProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/invoices/${id}/pay`,
        { paymentMethod },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Handle different payment methods
      switch (paymentMethod) {
        case 'stripe':
          const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
          const { sessionId } = response.data;
          await stripe.redirectToCheckout({ sessionId });
          break;

        case 'paypal':
          const { orderId } = response.data;
          window.location.href = `https://www.paypal.com/checkoutnow?token=${orderId}`;
          break;

        case 'flutterwave':
          const { paymentLink } = response.data;
          window.location.href = paymentLink;
          break;

        default:
          setError('Invalid payment method');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!invoice) return <div className="p-4">Invoice not found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-gray-600">
              Status:{' '}
              <span
                className={`inline-block px-2 py-1 text-sm rounded ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : invoice.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {invoice.status}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Due Date</p>
            <p className="font-semibold">
              {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">From</h2>
            <p>{invoice.seller.name}</p>
            <p>{invoice.seller.email}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">To</h2>
            <p>{invoice.buyer.name}</p>
            <p>{invoice.buyer.email}</p>
            {invoice.billingAddress && (
              <>
                <p>{invoice.billingAddress.street}</p>
                <p>
                  {invoice.billingAddress.city}, {invoice.billingAddress.state}{' '}
                  {invoice.billingAddress.zipCode}
                </p>
                <p>{invoice.billingAddress.country}</p>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Items</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Unit Price</th>
                <th className="px-4 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${item.subtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Tax</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Discount</span>
                  <span>-${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 border-t pt-4">
          {invoice.status === 'draft' && (
            <button
              onClick={handleSendInvoice}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
            >
              Send Invoice
            </button>
          )}
          {invoice.status === 'sent' && (
            <div className="flex items-center space-x-4">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">Select Payment Method</option>
                <option value="stripe">Credit Card (Stripe)</option>
                <option value="paypal">PayPal</option>
                <option value="flutterwave">Mobile Money (Flutterwave)</option>
              </select>
              <button
                onClick={handlePayment}
                disabled={paymentProcessing || !paymentMethod}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {paymentProcessing ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail; 