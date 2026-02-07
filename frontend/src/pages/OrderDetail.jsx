import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function getExpectedDelivery(createdAt, days = 3) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/orders/${id}`)
      .then(setOrder)
      .catch((e) => setError(e.status === 404 ? 'Order not found' : e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="loading">Loading order…</p>;
  if (error || !order) return <p className="error">{error || 'Order not found'}</p>;

  const hasShipping = order.shipping_customer_name || order.shipping_address || order.shipping_phone || order.shipping_email;

  return (
    <div className="order-detail">
      <div className="order-detail-header">
        <div className="order-detail-title-row">
          <h1 className="order-detail-title">Order #{order.id}</h1>
          <Link to="/orders" className="order-detail-back">← Back to orders</Link>
        </div>
        <div className="order-detail-badges">
          <span className={`order-detail-status order-detail-status--${(order.status || '').toLowerCase()}`}>
            {order.status}
          </span>
          <span className="order-detail-payment">{order.payment_status}</span>
        </div>
      </div>

      <div className="order-detail-grid">
        <div className="order-detail-main">
          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Order items</h2>
            <ul className="order-detail-items">
              {order.items?.map((item) => (
                <li key={item.id} className="order-detail-item">
                  <span className="order-detail-item-name">{item.product?.name ?? 'Product'} × {item.quantity}</span>
                  <span className="order-detail-item-subtotal">${Number(item.subtotal).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="order-detail-sidebar">
          <section className="order-detail-section order-detail-summary">
            <h2 className="order-detail-section-title">Summary</h2>
            <div className="order-detail-summary-row">
              <span>Placed</span>
              <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="order-detail-summary-row order-detail-summary-delivery">
              <span>Expected delivery</span>
              <span>{getExpectedDelivery(order.created_at)}</span>
            </div>
            <div className="order-detail-summary-row order-detail-summary-total">
              <span>Total</span>
              <span>${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </section>

          {hasShipping && (
            <section className="order-detail-section">
              <h2 className="order-detail-section-title">Shipping Information</h2>
              <div className="order-detail-shipping">
                {order.shipping_customer_name && (
                  <div className="order-detail-shipping-row">
                    <span className="order-detail-shipping-label">Name</span>
                    <span>{order.shipping_customer_name}</span>
                  </div>
                )}
                {order.shipping_address && (
                  <div className="order-detail-shipping-row">
                    <span className="order-detail-shipping-label">Address</span>
                    <span className="order-detail-shipping-address">{order.shipping_address}</span>
                  </div>
                )}
                {order.shipping_email && (
                  <div className="order-detail-shipping-row">
                    <span className="order-detail-shipping-label">Email</span>
                    <span>{order.shipping_email}</span>
                  </div>
                )}
                {order.shipping_phone && (
                  <div className="order-detail-shipping-row">
                    <span className="order-detail-shipping-label">Phone</span>
                    <span>{order.shipping_phone}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
