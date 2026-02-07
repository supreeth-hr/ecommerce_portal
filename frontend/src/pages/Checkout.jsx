import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 12 }, (_, i) => currentYear + i);

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    customer_name: '',
    address: '',
    phone: '',
    email: '',
    cardholder_name: '',
    card_number: '',
    expiry_month: 12,
    expiry_year: currentYear + 2,
    cvv: '',
  });

  useEffect(() => {
    api('/cart')
      .then(setCart)
      .catch((e) => setError(e.message || 'Failed to load cart'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === 'expiry_month' || name === 'expiry_year') next = Number(value);
    if (name === 'card_number') next = value.replace(/\D/g, '').slice(0, 19);
    if (name === 'cvv') next = value.replace(/\D/g, '').slice(0, 4);
    if (name === 'phone') next = value.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, [name]: next }));
  };

  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart?.items?.length) {
      setError('Cart is empty');
      return;
    }
    const requiredFields = [
      { key: 'customer_name', label: 'Full name' },
      { key: 'address', label: 'Address' },
      { key: 'phone', label: 'Phone number' },
      { key: 'email', label: 'Email address' },
      { key: 'cardholder_name', label: 'Cardholder name' },
      { key: 'card_number', label: 'Card number' },
      { key: 'cvv', label: 'CVV' },
    ];
    const missing = requiredFields.find(({ key }) => !String(form[key] || '').trim());
    if (missing) {
      setError(`Please enter ${missing.label.toLowerCase()}`);
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (form.email && !isValidEmail(form.email)) {
      setError('Enter a valid email address');
      return;
    }
    const digits = form.card_number.replace(/\D/g, '');
    const cardLast4 = digits.slice(-4);
    if (cardLast4.length !== 4) {
      setError('Enter a valid card number');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shipping_customer_name: form.customer_name || null,
          shipping_address: form.address || null,
          shipping_phone: form.phone || null,
          shipping_email: form.email || null,
          payment: {
            cardholder_name: form.cardholder_name,
            card_last4: cardLast4,
            expiry_month: form.expiry_month,
            expiry_year: form.expiry_year,
          },
        }),
      });
      navigate('/orders');
    } catch (err) {
      setError(err.body?.detail || (Array.isArray(err.body) ? err.body.map((x) => x.msg).join(' ') : 'Order failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="loading">Loading…</p>;
  if (error && !cart) return <p className="error">{error}</p>;
  if (!cart?.items?.length) {
    return (
      <div className="checkout-page">
        <h1 className="checkout-page-title">Checkout</h1>
        <div className="checkout-empty">
          <p>Your cart is empty.</p>
          <Link to="/products" className="checkout-empty-link">Browse products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-page-title">Checkout</h1>
      <div className="checkout-layout">
        <form onSubmit={handleSubmit} className="checkout-form">
          <section className="checkout-section">
            <h2 className="checkout-section-title">Shipping & contact</h2>
            <div className="checkout-fields">
              <label className="checkout-label">
                Full name
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="checkout-input"
                  required
                />
              </label>
              <label className="checkout-label">
                Address
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, city, state, ZIP"
                  rows={3}
                  className="checkout-input checkout-textarea"
                  required
                />
              </label>
              <label className="checkout-label">
                Phone number <span className="checkout-required">(10 digits)</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="checkout-input"
                  maxLength={10}
                  required
                />
              </label>
              <label className="checkout-label">
                Email address
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="checkout-input"
                  required
                />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section-title">Payment information</h2>
            <div className="checkout-fields">
              <label className="checkout-label">
                Cardholder name
                <input
                  name="cardholder_name"
                  value={form.cardholder_name}
                  onChange={handleChange}
                  placeholder="Name on card"
                  className="checkout-input"
                  required
                />
              </label>
              <label className="checkout-label">
                Card number
                <input
                  name="card_number"
                  value={form.card_number}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  className="checkout-input"
                  maxLength={19}
                  required
                />
              </label>
              <div className="checkout-row">
                <label className="checkout-label checkout-label--half">
                  Expiry month
                  <select
                    name="expiry_month"
                    value={form.expiry_month}
                    onChange={handleChange}
                    className="checkout-input checkout-select"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                </label>
                <label className="checkout-label checkout-label--half">
                  Expiry year
                  <select
                    name="expiry_year"
                    value={form.expiry_year}
                    onChange={handleChange}
                    className="checkout-input checkout-select"
                    required
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="checkout-label checkout-label--third">
                CVV
                <input
                  name="cvv"
                  type="password"
                  inputMode="numeric"
                  value={form.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  className="checkout-input"
                  maxLength={4}
                  required
                />
              </label>
            </div>
          </section>

          {error && <p className="error checkout-error">{error}</p>}
          <button type="submit" className="checkout-submit" disabled={submitting}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>

        <div className="checkout-order">
          <h2 className="checkout-order-title">Order summary</h2>
          <ul className="checkout-order-list">
            {cart.items.map((item) => (
              <li key={item.id} className="checkout-order-item">
                <span className="checkout-order-item-name">{item.product?.name} × {item.quantity}</span>
                <span className="checkout-order-item-price">${(item.quantity * (item.product?.price || 0)).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout-order-total">
            <span>Total</span>
            <span>${Number(cart.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
