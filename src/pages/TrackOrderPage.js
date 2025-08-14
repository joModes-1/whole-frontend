import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../services/orderService';
import './TrackOrderPage.css';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const allowedToCancel = (status) => ['pending', 'confirmed'].includes(status);

const TrackOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const formatUGX = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount || 0);
    } catch {
      return `UGX ${Math.round(amount || 0).toLocaleString('en-UG')}`;
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOrderById(id);
      setOrder(data);
    } catch (e) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Optional: poll every 30s for live updates
    const t = setInterval(fetchOrder, 30000);
    return () => clearInterval(t);
  }, [fetchOrder]);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const idx = STATUS_STEPS.findIndex((s) => s.key === order.status);
    return idx === -1 ? 0 : idx;
  }, [order]);

  const handleCancel = async () => {
    if (!order) return;
    const ok = window.confirm('Are you sure you want to cancel this order?');
    if (!ok) return;
    try {
      setCancelling(true);
      await cancelOrder(order._id);
      await fetchOrder();
    } catch (e) {
      setError(e.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="track-order-container"><div className="spinner"></div><p>Loading order...</p></div>
    );
  }

  if (error) {
    return (
      <div className="track-order-container">
        <div className="error">{error}</div>
        <button className="btn" onClick={fetchOrder}>Retry</button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="track-order-container">
      <div className="track-order-header">
        <h2>Track Order</h2>
        <div className="meta">
          <span className="badge status">{order.status}</span>
          <span className="order-number">Order #{order.orderNumber || order._id?.slice(-6)}</span>
        </div>
      </div>

      <div className="order-summary-card">
        <div>
          <div className="label">Items</div>
          <div className="value">{order.items?.length || 0}</div>
        </div>
        <div>
          <div className="label">Total</div>
          <div className="value">{formatUGX(order.totalAmount)}</div>
        </div>
        <div>
          <div className="label">Placed on</div>
          <div className="value">{new Date(order.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="timeline">
        {STATUS_STEPS.map((step, index) => {
          const reached = index <= currentStepIndex;
          return (
            <div className={`timeline-step ${reached ? 'reached' : ''}`} key={step.key}>
              <div className="dot" />
              <div className="label">{step.label}</div>
              {index < STATUS_STEPS.length - 1 && (
                <div className={`bar ${index < currentStepIndex ? 'filled' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="actions">
        <button className="btn secondary" onClick={() => navigate('/orders')}>Back to My Orders</button>
        {allowedToCancel(order.status) && (
          <button className="btn danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div className="items-list">
        {order.items?.map((it) => (
          <div className="item" key={it._id}>
            <div className="name">{it.name}</div>
            <div className="qty">x{it.quantity}</div>
            <div className="amount">{formatUGX(it.unitPrice * it.quantity)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackOrderPage;
