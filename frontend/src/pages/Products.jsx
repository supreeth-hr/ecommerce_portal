import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const q = searchParams.get('q');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const promise = q
      ? api(`/products/search?q=${encodeURIComponent(q)}`)
      : api(category ? `/products?category=${encodeURIComponent(category)}` : '/products');
    promise
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [category, q]);

  useEffect(() => {
    api('/products/categories').then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="products-page">
      <h1>
        {q ? `Search: "${q}"` : category ? category : 'All products'}
      </h1>
      <div className="categories-bar">
        <Link to="/products" className={!category && !q ? 'active' : ''}>All</Link>
        {categories.map((c) => (
          <Link
            key={c.value}
            to={`/products?category=${encodeURIComponent(c.value)}`}
            className={category === c.value ? 'active' : ''}
          >
            {c.label}
          </Link>
        ))}
      </div>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>No products found.</p>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
