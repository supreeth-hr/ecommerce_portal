## Simple E-commerce Portal – Backend

This project provides a simple e-commerce backend built with **FastAPI**, **PostgreSQL**, **SQLAlchemy**, and **JWT authentication**. It exposes APIs for:

- **Authentication**: register, login, logout, get current user
- **Products**: list products, get product details
- **Cart**: view cart, add/update/remove items, clear cart
- **Orders**: place an order (with **simulated payment**), list orders, view order details, update order status (admin)

**Frontend:** React + Vite app (**Shoppy**) in `frontend/` – home page, auth (login/register), product listing, cart, checkout, orders.

---

### 1. Prerequisites

- Python 3.11+ (recommended)
- PostgreSQL running locally
- `pip` (Python package manager)

**For detailed database setup instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md)**

Quick setup (using PostgreSQL superuser):

```sql
CREATE DATABASE ecommerce_db;
```

---

### 2. Backend setup

From the project root (`ecommerce-portal`):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file in the project root (same level as `requirements.txt`) with at least:

```env
DATABASE_URL=postgresql+psycopg2://postgres:your_postgres_password@localhost:5432/ecommerce_db
JWT_SECRET_KEY=CHANGE_ME_TO_A_RANDOM_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_ORIGIN=http://localhost:5173
```

**Note:** Replace `your_postgres_password` with your PostgreSQL superuser password. If no password is set (common in local development), use: `postgresql+psycopg2://postgres@localhost:5432/ecommerce_db`

> If any of these are omitted, sensible defaults from `backend/app/config.py` will be used (but you should change the JWT secret for real use).

---

### 3. Running the FastAPI server

From the project root:

```bash
uvicorn backend.app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

Interactive API docs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

On startup, the app will automatically create the database tables defined in `backend/app/models.py`.

---

### 4. Running the frontend (Shoppy)

From the project root:

```bash
cd frontend
npm install   # if not already done
npm run dev
```

The app will be at `http://localhost:5173`. Set `VITE_API_URL=http://127.0.0.1:8000` in `frontend/.env` (default) so it talks to your FastAPI backend.

---

### 5. API Overview

#### Auth

- `POST /auth/register`
  - Body: `{ "email": string, "full_name": string | null, "password": string }`
  - Registers a new user.

- `POST /auth/login` (OAuth2 password flow)
  - Form data: `username=<email>&password=<password>`
  - Returns: `{ "access_token": "...", "token_type": "bearer" }`

- `POST /auth/logout`
  - Stateless: simply instructs the client to discard its token.

- `GET /auth/me`
  - Requires `Authorization: Bearer <token>`
  - Returns current user info.

#### Products

- `GET /products/categories`
  - Public: returns the fixed list of product categories (value and label). Use for filters/dropdowns.

- `GET /products`
  - Public: returns a list of products.
  - Optional query parameter: `?category=Electronics` to filter by category. Category must be one of: Electronics, Fashion & Apparel, Books & Media, Home & Living, Sports & Outdoor, Grocery & Food.

- `GET /products/search?q={keywords}`
  - Public: searches products by keywords in name, description, and category.
  - Case-insensitive partial matching.
  - Example: `GET /products/search?q=laptop` returns products matching "laptop" in any field.

- `GET /products/{id}`
  - Public: returns a single product by ID.

#### Product Reviews (Comments)

- `GET /products/{product_id}/reviews`
  - Public: returns all reviews for a product (includes author info).

- `POST /products/{product_id}/reviews`
  - Requires auth. Body: `{ "comment": "string", "rating": 1-5 (optional) }`. Add a review.

- `GET /reviews/{review_id}`
  - Public: returns a single review.

- `PUT /reviews/{review_id}`
  - Requires auth. Update your own review (body: `{ "comment": "string", "rating": 1-5 }`, both optional). Admins can edit any review.

- `DELETE /reviews/{review_id}`
  - Requires auth. Delete your own review. Admins can delete any review.

#### Adding Products & Product Images

**Product Images Storage:**

Product images are stored in the `static/images/products/` directory and served via FastAPI's static file serving.

- **Directory structure**: `static/images/products/`
- **Image URL format**: `/static/images/products/your-image.jpg`
- **Access**: Images are accessible at `http://127.0.0.1:8000/static/images/products/your-image.jpg`

**To add product images:**

1. Place your image files (`.jpg`, `.png`, etc.) in the `static/images/products/` directory.
2. When inserting products into the database, set the `image_url` field to `/static/images/products/your-image.jpg` (relative path).

**Adding Products Manually:**

You can insert products directly into the `products` table using SQL or a database client (e.g., pgAdmin, DBeaver, psql):

```sql
INSERT INTO products (name, description, category, price, image_url, stock, created_at)
VALUES 
  ('Laptop', 'High-performance laptop', 'Electronics', 999.99, '/static/images/products/laptop.jpg', 10, NOW()),
  ('Smartphone', 'Latest smartphone model', 'Electronics', 699.99, '/static/images/products/phone.jpg', 25, NOW()),
  ('Headphones', 'Wireless noise-cancelling headphones', 'Electronics', 199.99, '/static/images/products/headphones.jpg', 50, NOW()),
  ('T-Shirt', 'Cotton t-shirt', 'Clothing', 29.99, '/static/images/products/tshirt.jpg', 100, NOW()),
  ('Novel', 'Bestselling fiction novel', 'Books', 15.99, '/static/images/products/novel.jpg', 200, NOW());
```

**Product Schema:**
- `name` (string, required): Product name
- `description` (text, optional): Product description
- `category` (string, optional): Product category (e.g., "Electronics", "Clothing", "Books")
- `price` (float, required): Product price
- `image_url` (string, optional): Path to image (e.g., `/static/images/products/product.jpg`)
- `stock` (integer, default 0): Available stock quantity
- `created_at` (timestamp): Auto-set on creation

> **Note**: Make sure the image files exist in `static/images/products/` before referencing them in the database, or the frontend will show broken image links.

#### Cart (requires auth)

All cart endpoints require a JWT access token:

- `GET /cart`
  - Returns `items`, `total_quantity`, `total_amount`.

- `POST /cart/items`
  - Body: `{ "product_id": number, "quantity": number }`
  - Adds a new item or increases quantity.

- `PATCH /cart/items/{item_id}`
  - Body: `{ "quantity": number }` (if `0`, the item is removed).

- `DELETE /cart/items/{item_id}`
  - Removes an item.

- `DELETE /cart`
  - Clears the entire cart.

#### Orders (requires auth)

- `POST /orders`
  - Body:
    ```json
    {
      "payment": {
        "cardholder_name": "John Doe",
        "card_last4": "4242",
        "expiry_month": 12,
        "expiry_year": 2030
      }
    }
    ```
  - **Simulated payment**: only local validation is performed; no external payment gateway.
  - If the user’s cart has items:
    - Marks payment status as `PAID`
    - Creates an order and order items
    - Optionally decrements product stock
    - Clears the cart

- `GET /orders`
  - Returns a list of the user’s orders (id, status, payment_status, total_amount, created_at).

- `GET /orders/{order_id}`
  - Returns full order details including items.

- `PATCH /orders/{order_id}/status`
  - Changes order status (e.g., `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - **Requires an admin user** (`is_admin = true` in the database).
  - Useful to simulate order status changes during testing.

#### Admin APIs (Developer/Admin Only)

All admin endpoints require **admin authentication** (`is_admin = true`). See [DATABASE_SETUP.md](DATABASE_SETUP.md) for how to make a user admin.

**Product Management:**

- `POST /admin/products`
  - Create a single product.
  - Body: `{ "name": string, "description": string | null, "category": string | null, "price": number, "image_url": string | null, "stock": number }`
  - Returns the created product.

- `POST /admin/products/bulk`
  - Create multiple products at once (useful for seeding).
  - Body: `[{ "name": "...", ... }, { "name": "...", ... }]` (array of products)
  - Returns array of created products.

- `PUT /admin/products/{product_id}`
  - Update an existing product.
  - Body: Same as create product.

- `DELETE /admin/products/{product_id}`
  - Delete a product.

**Example: Creating a product via API:**

```bash
# 1. Register and login to get a token (if not already done)
POST /auth/register
POST /auth/login

# 2. Make your user admin (via SQL)
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';

# 3. Create a product
POST /admin/products
Authorization: Bearer <your-admin-token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "category": "Electronics",
  "price": 999.99,
  "image_url": "/static/images/products/laptop.jpg",
  "stock": 10
}
```

---

### 6. Typical usage flow

1. **Register** a new user via `POST /auth/register`.
2. **Login** via `POST /auth/login` and capture the `access_token`.
3. Use `Authorization: Bearer <access_token>` for all protected routes.
4. (Optionally) Insert some `products` directly into the `products` table for testing.
5. **List products** via `GET /products` and pick IDs.
6. **Build a cart** using `POST /cart/items`.
7. **View cart** via `GET /cart`.
8. **Place an order** using `POST /orders` with simulated payment info.
9. **Track orders** via `GET /orders` and `GET /orders/{id}`.
10. (Optional admin) **Update order status** using `PATCH /orders/{id}/status`.

---

The frontend (React + Vite) will later consume these APIs, using the same JWT access token for authenticated requests.

