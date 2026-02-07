import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api('/products/categories').then(setCategories).catch(() => {});
  }, []);

  const fetchCartCount = () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    api('/cart')
      .then((data) => setCartCount(data.total_quantity || 0))
      .catch(() => setCartCount(0));
  };

  useEffect(() => {
    fetchCartCount();
  }, [user, pathname]);

  useEffect(() => {
    const onCartUpdated = () => fetchCartCount();
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <img src="/shoppy-logo.png" alt="Shoppy" className="logo-img" />
          Shoppy
        </Link>
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-wrap">
            <input
              type="search"
              placeholder="Search Shoppy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn" title="Search" aria-label="Search">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </form>
        <nav className="nav">
          <Link to="/products" className="nav-category">Products</Link>
          {categories.slice(0, 4).map((c) => (
            <Link key={c.value} to={`/products?category=${encodeURIComponent(c.value)}`} className="nav-category">
              {c.label}
            </Link>
          ))}
          {user ? <Link to="/orders">Orders</Link> : null}
          <Link to="/account">Account</Link>
          <Link to="/cart" className="cart-link" title="Cart" aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}>
            <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
