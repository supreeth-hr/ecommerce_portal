import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const loadCart = () => {
    api('/cart')
      .then(setCart)
      .catch((e) => setError(e.message || 'Failed to load cart'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 0) return;
    setUpdating(itemId);
    try {
      await api(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: quantity === 0 ? 0 : quantity }),
      });
      loadCart();
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      setError(err.body?.detail || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId) => {
    setUpdating(itemId);
    try {
      await api(`/cart/items/${itemId}`, { method: 'DELETE' });
      loadCart();
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      setError(err.body?.detail || 'Failed to remove');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p className="loading">Loading cart…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!cart) return null;

  const { items = [], total_quantity, total_amount } = cart;
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-page-title">Your cart</h1>
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link to="/products" className="cart-empty-link">Browse products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-page-title">Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => {
            const imgUrl = item.product?.image_url ? `${BASE}${item.product.image_url}` : null;
            const unitPrice = Number(item.product?.price || 0);
            const lineTotal = unitPrice * (item.quantity || 0);
            return (
              <li key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {imgUrl ? <img src={imgUrl} alt={item.product.name} /> : <div className="product-card-placeholder">No image</div>}
                </div>
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.product?.name}</h3>
                  <p className="cart-item-unit-price">${unitPrice.toFixed(2)} each</p>
                  <div className="cart-item-actions">
                    <label className="cart-item-qty-label">
                      Qty
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        disabled={updating === item.id}
                        className="cart-item-qty-input"
                      />
                    </label>
                    <button type="button" className="cart-item-remove" onClick={() => removeItem(item.id)} disabled={updating === item.id}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-item-total">
                  ${lineTotal.toFixed(2)}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span className="cart-summary-label">Items</span>
            <span className="cart-summary-value">{total_quantity}</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span className="cart-summary-label">Total</span>
            <span className="cart-summary-value">${Number(total_amount).toFixed(2)}</span>
          </div>
          <Link to="/checkout" className="cart-checkout-btn">Proceed to checkout</Link>
        </div>
      </div>
    </div>
  );
}
