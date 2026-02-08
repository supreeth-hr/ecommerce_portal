import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  useEffect(() => {
    api(`/products/${id}`)
      .then(setProduct)
      .catch((e) => setError(e.status === 404 ? 'Product not found' : e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api(`/products/${id}/reviews`)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [id]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await api('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: Number(id), quantity }),
      });
      setAdding(false);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      setAdding(false);
      const d = err.body?.detail;
      const raw = Array.isArray(d) ? d.map((x) => x.msg).join(' ') : (d || 'Failed to add to cart.');
      setError(String(raw).replace(/^Value error,?\s*/i, ''));
    }
  };

  const myReview = user && reviews.find((r) => r.user_id === user.id);

  useEffect(() => {
    const mine = user && reviews.find((r) => r.user_id === user.id);
    if (mine) {
      setReviewComment(mine.comment);
      setReviewRating(mine.rating);
    } else if (!user) {
      setReviewComment('');
      setReviewRating(5);
    }
  }, [user, reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    setReviewError('');
    setReviewSubmitting(true);
    try {
      await api(`/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ comment: reviewComment, rating: reviewRating }),
      });
      setReviewComment('');
      setReviewRating(5);
      const data = await api(`/products/${id}/reviews`);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      const d = err.body?.detail;
      const raw = Array.isArray(d) ? d.map((x) => x.msg).join(' ') : (d || 'Failed to submit review.');
      setReviewError(String(raw).replace(/^Value error,?\s*/i, ''));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    const reviewId = editingReviewId || myReview?.id;
    if (!user || !reviewId) return;
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const updated = await api(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({ comment: reviewComment, rating: reviewRating }),
      });
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingReviewId(null);
    } catch (err) {
      const d = err.body?.detail;
      const raw = Array.isArray(d) ? d.map((x) => x.msg).join(' ') : (d || 'Failed to update review.');
      setReviewError(String(raw).replace(/^Value error,?\s*/i, ''));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const startEditingReview = (r) => {
    setReviewComment(r.comment);
    setReviewRating(r.rating);
    setReviewError('');
    setEditingReviewId(r.id);
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    if (myReview) {
      setReviewComment(myReview.comment);
      setReviewRating(myReview.rating);
    }
    setReviewError('');
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setDeletingReviewId(reviewId);
    setReviewError('');
    try {
      await api(`/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReviewId === reviewId) setEditingReviewId(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      const d = err.body?.detail;
      const raw = Array.isArray(d) ? d.map((x) => x.msg).join(' ') : (d || 'Failed to delete review.');
      setReviewError(String(raw).replace(/^Value error,?\s*/i, ''));
    } finally {
      setDeletingReviewId(null);
    }
  };

  const formatReviewDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) return <p className="loading">Loading…</p>;
  if (error || !product) return <p className="error">{error || 'Product not found'}</p>;

  const imageUrl = product.image_url ? `${BASE}${product.image_url}` : null;

  return (
    <div className="product-detail">
      <div className="product-detail-main">
        <div className="product-detail-image">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} />
          ) : (
            <div className="product-card-placeholder">No image</div>
          )}
        </div>
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-category">{product.category || '—'}</p>
          <p className="product-detail-price">${Number(product.price).toFixed(2)}</p>
          {product.description && <p className="product-detail-desc">{product.description}</p>}
          <form onSubmit={handleAddToCart} className="add-to-cart-form">
            <div className="add-to-cart-row">
              <label className="quantity-label">Quantity</label>
              <div className="quantity-controls">
                <button
                  type="button"
                  className="quantity-btn"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="quantity-input"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  className="quantity-btn"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <button type="submit" className="add-to-cart-btn" disabled={adding}>
                {adding ? 'Adding…' : user ? 'Add to cart' : 'Login to add to cart'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <section className="reviews-section">
        <h2>Reviews</h2>
        {reviews.length === 0 && <p className="reviews-empty">No reviews yet.</p>}
        <ul className="reviews-list">
          {reviews.map((r) => (
            <li key={r.id} className={`review-item ${r.user_id === user?.id ? 'review-item--own' : ''} ${editingReviewId === r.id ? 'review-item--editing' : ''}`}>
              {editingReviewId === r.id ? (
                <form onSubmit={handleUpdateReview} className="review-inline-edit">
                  {reviewError && <p className="error">{reviewError}</p>}
                  <label>
                    Rating (1–5)
                    <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} ★</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Comment
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required rows={3} />
                  </label>
                  <div className="review-inline-edit-actions">
                    <button type="submit" className="review-form-btn" disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="review-form-btn review-form-btn--secondary" onClick={cancelEditingReview} disabled={reviewSubmitting}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="review-item-header">
                    <span className="review-meta">{r.user_name} · {r.rating}★</span>
                    <span className="review-item-header-right">
                      <span className="review-date">{formatReviewDate(r.created_at)}</span>
                      {r.user_id === user?.id && (
                        <>
                          <button type="button" className="review-edit-icon" onClick={() => startEditingReview(r)} title="Edit review" aria-label="Edit review" disabled={deletingReviewId != null}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button type="button" className="review-delete-icon" onClick={() => handleDeleteReview(r.id)} title="Delete review" aria-label="Delete review" disabled={deletingReviewId != null}>
                            {deletingReviewId === r.id ? (
                              <span className="review-delete-spinner">…</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="review-comment">{r.comment}</p>
                </>
              )}
            </li>
          ))}
        </ul>
        {user && !myReview && (
          <form onSubmit={handleSubmitReview} className="review-form">
            <h3>Add a review</h3>
            {reviewError && <p className="error">{reviewError}</p>}
            <label>
              Rating (1–5)
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>
            </label>
            <label>
              Comment
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required rows={3} />
            </label>
            <button type="submit" className="review-form-btn" disabled={reviewSubmitting}>
              {reviewSubmitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
