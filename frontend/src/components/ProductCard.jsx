import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function ProductCard({ product }) {
  const imageUrl = product.image_url ? `${BASE}${product.image_url}` : null;
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} />
        ) : (
          <div className="product-card-placeholder">No image</div>
        )}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category || '—'}</p>
        <p className="product-price">${Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}
