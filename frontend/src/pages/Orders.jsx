import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ORDER_STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function getExpectedDelivery(createdAt, daysFromNow = 3) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function OrderStatusStepper({ status }) {
  const currentStatus = (status || '').toUpperCase();
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <div className="order-status-stepper order-status-stepper--cancelled">
        <span className="order-status-badge order-status-badge--cancelled">Cancelled</span>
      </div>
    );
  }

  return (
    <div className="order-status-stepper" role="list" aria-label="Order status">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const stepClass = [
          'order-status-step',
          isDone && 'order-status-step--done',
          isCurrent && 'order-status-step--current',
        ].filter(Boolean).join(' ');
        return (
          <div key={step} className={stepClass} role="listitem">
            <span className="order-status-step-dot" />
            <span className="order-status-step-label">{step.charAt(0) + step.slice(1).toLowerCase()}</span>
            {index < ORDER_STATUS_FLOW.length - 1 && (
              <span className="order-status-step-connector" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/orders')
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading orders…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="orders-page">
      <h1 className="orders-page-title">Your orders</h1>
      {orders.length === 0 ? (
        <p className="orders-empty">No orders yet.</p>
      ) : (
        <ul className="orders-list">
          {orders.map((order) => (
            <li key={order.id} className="order-card">
              <div className="order-card-inner">
                <div className="order-card-header">
                  <span className="order-number">Order #{order.id}</span>
                  <div className="order-card-header-status">
                    <OrderStatusStepper status={order.status} />
                  </div>
                </div>
                <div className="order-card-body">
                  <div className="order-shipping">
                    <div className="order-shipping-row">
                      <span className="order-shipping-label">Name</span>
                      <span className="order-shipping-value">{order.shipping_customer_name || '—'}</span>
                    </div>
                    <div className="order-shipping-row">
                      <span className="order-shipping-label">Address</span>
                      <span className="order-shipping-value order-shipping-address">{order.shipping_address || '—'}</span>
                    </div>
                    <div className="order-shipping-row">
                      <span className="order-shipping-label">Email</span>
                      <span className="order-shipping-value">{order.shipping_email || '—'}</span>
                    </div>
                    <div className="order-shipping-row">
                      <span className="order-shipping-label">Phone</span>
                      <span className="order-shipping-value">{order.shipping_phone || '—'}</span>
                    </div>
                  </div>
                  <div className="order-meta">
                    <div className="order-meta-row">
                      <span className="order-meta-label">Placed</span>
                      <span className="order-meta-value">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="order-meta-row order-meta-delivery">
                      <span className="order-meta-label">Expected delivery</span>
                      <span className="order-meta-value">{getExpectedDelivery(order.created_at)}</span>
                    </div>
                    <div className="order-meta-row order-meta-total">
                      <span className="order-meta-label">Total</span>
                      <span className="order-meta-value">${Number(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="order-card-footer">
                  <Link to={`/orders/${order.id}`} className="order-view-link">View order details</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
