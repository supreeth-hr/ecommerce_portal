import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/products')
      .then((data) => setProducts(Array.isArray(data) ? data.slice(0, 12) : []))
      .catch((e) => setError(e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to Shoppy!</h1>
        <p>Discover what you love. Simple shopping, trusted delivery, and everything you need—all in one place.</p>
      </section>
      <section className="section">
        <h2>Featured products</h2>
        {loading && <p className="loading">Loading products…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p>No products yet.</p>
        )}
        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        {!loading && products.length > 0 && (
          <p className="view-all">
            <Link to="/products">View all products →</Link>
          </p>
        )}
      </section>
    </div>
  );
}
