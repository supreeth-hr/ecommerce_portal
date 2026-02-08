# Shoppy – E-commerce Portal

A full-stack e-commerce application with a **FastAPI** backend and a **React + Vite** frontend. Users can browse products, add items to cart, place orders, and track order status. Includes authentication, product reviews, and admin features.

---

## Table of contents

- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Database setup](#database-setup)
- [Using a different database](#using-a-different-database-sqlite-mysql)
- [Backend setup & run](#backend-setup--run)
- [Frontend setup & run](#frontend-setup--run)
- [Quick start](#quick-start)
- [Backend overview](#backend-overview)
- [Frontend overview](#frontend-overview)
- [API overview](#api-overview)
- [Making a user admin](#making-a-user-admin)
- [Typical usage flow](#typical-usage-flow)

---

## Project structure

```
ecommerce-portal/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app, CORS, static files, routers
│       ├── config.py        # Settings (DB, JWT, CORS) from .env
│       ├── database.py      # SQLAlchemy engine, session, get_db
│       ├── auth.py          # JWT, password hashing, get_current_user
│       ├── models.py        # User, Product, CartItem, Order, OrderItem, Review
│       ├── schemas.py       # Pydantic request/response models
│       └── routers/
│           ├── auth.py      # Register, login, logout, /me, delete account
│           ├── products.py  # List, search, categories, product by id
│           ├── cart.py      # Get cart, add/update/remove items
│           ├── orders.py    # Place order, list orders, order detail, status (admin)
│           ├── reviews.py   # CRUD reviews for products
│           └── admin.py     # Create/update/delete products (admin only)
├── frontend/
│   ├── src/
│   │   ├── api.js           # API client (fetch + JWT)
│   │   ├── App.jsx          # Routes, AuthProvider, ProtectedRoute
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/     # Header, Layout, ProductCard
│   │   └── pages/           # Home, Products, ProductDetail, Cart, Checkout, Orders, Account, Login, Register
│   ├── public/
│   └── package.json
├── static/
│   └── images/products/     # Product images (served by backend)
├── .env                     # Create this: DATABASE_URL, JWT_SECRET_KEY, etc.
├── requirements.txt
└── README.md
```

---

## Tech stack

| Layer     | Technologies |
|----------|--------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, database (PostgreSQL by default; SQLite/MySQL supported), Pydantic, JWT (python-jose), bcrypt |
| **Frontend** | React 18, Vite, React Router, CSS (no UI framework) |

---

## Prerequisites

- **Python 3.11+** and `pip`
- **Node.js 18+** and `npm`
- **A database**: the project is set up for **PostgreSQL** by default. You can also use **SQLite** or **MySQL** with small changes (see [Using a different database](#using-a-different-database-sqlite-mysql)).

---

## Database setup

### 1. Install PostgreSQL

- **macOS (Homebrew):** `brew install postgresql@16` then `brew services start postgresql@16`
- **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/) and run the installer.
- **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install postgresql postgresql-contrib`

Ensure the PostgreSQL service is running (e.g. port `5432`).

### 2. Create the database

Using the default superuser (often `postgres`):

**Option A – psql (command line):**

```bash
# macOS/Linux: switch to postgres user or use local role
psql -U postgres -c "CREATE DATABASE ecommerce_db;"
```

**Option B – pgAdmin or DBeaver:**  
Create a new database named `ecommerce_db`.

**Option C – no password (common on local macOS):**

```bash
psql postgres -c "CREATE DATABASE ecommerce_db;"
```

### 3. Connection URL

- **With password:** `postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_db`
- **No password:** `postgresql+psycopg2://postgres@localhost:5432/ecommerce_db`

Use this value for `DATABASE_URL` in the `.env` file in the next section.  
Tables are created automatically when you start the backend (see [Backend setup & run](#backend-setup--run)).

---

### Using a different database (SQLite, MySQL)

The app uses **SQLAlchemy**, so you can point it at another database by changing the connection URL and, if needed, the driver.

#### SQLite (no separate server)

- No extra package: Python’s built-in `sqlite3` works with SQLAlchemy.
- In `.env` set:
  ```env
  DATABASE_URL=sqlite:///./ecommerce.db
  ```
- The file `ecommerce.db` will be created in the project root when the app runs. No “create database” step.

**Note:** For SQLite, use three slashes (`sqlite:///`) and a path. Avoid using SQLite with multiple worker processes in production.

#### MySQL / MariaDB

- Install a driver, e.g.:
  ```bash
  pip install pymysql
  ```
- Create a database (e.g. `ecommerce_db`) in MySQL, then in `.env` set:
  ```env
  DATABASE_URL=mysql+pymysql://user:password@localhost:3306/ecommerce_db
  ```
- Replace `user`, `password`, and port/host if different.

The same `backend/app/models.py` and code are used; only `DATABASE_URL` and the optional extra driver change. Enum and column types used in the project are compatible with PostgreSQL, SQLite, and MySQL.

---

## Backend setup & run

From the **project root** (`ecommerce-portal`):

### 1. Virtual environment and dependencies

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables

Create a `.env` file in the project root (same level as `requirements.txt`):

```env
DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/ecommerce_db
JWT_SECRET_KEY=change_me_to_a_long_random_secret_string
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_ORIGIN=http://localhost:5173
```

- Replace `your_password` with your PostgreSQL password (or omit `:your_password` if none).
- Replace `JWT_SECRET_KEY` with a long random string for production.

Defaults are defined in `backend/app/config.py` if you omit variables; you should still set `DATABASE_URL` and `JWT_SECRET_KEY` for your environment.

### 3. Start the API server

```bash
uvicorn backend.app.main:app --reload
```

- API base URL: **http://127.0.0.1:8000**
- Interactive docs: **http://127.0.0.1:8000/docs** (Swagger)
- ReDoc: **http://127.0.0.1:8000/redoc**

On first run, the app creates all tables (users, products, cart_items, orders, order_items, reviews) from `backend/app/models.py`.

---

## Frontend setup & run

From the **project root**:

```bash
cd frontend
npm install
npm run dev
```

- App URL: **http://localhost:5173**

### Frontend environment (optional)

Create `frontend/.env` if you need to point to a different API:

```env
VITE_API_URL=http://127.0.0.1:8000
```

If omitted, the app uses `http://127.0.0.1:8000` by default.

---

## Quick start

1. **Database:** Create PostgreSQL database `ecommerce_db` (see [Database setup](#database-setup)).
2. **Backend:** In project root: `python -m venv venv`, activate it, `pip install -r requirements.txt`, create `.env` with `DATABASE_URL` and `JWT_SECRET_KEY`, then run `uvicorn backend.app.main:app --reload`.
3. **Frontend:** In another terminal, `cd frontend`, `npm install`, `npm run dev`.
4. Open **http://localhost:5173** – register, browse products, add to cart, checkout, and view orders.

Product images are served from `static/images/products/`. The repo includes sample images; you can add products via the admin API or by inserting rows into the `products` table (see [API overview](#api-overview)).

---

## Backend overview

- **Framework:** FastAPI. Routers are under `backend/app/routers/` (auth, products, cart, orders, reviews, admin).
- **Database:** SQLAlchemy 2 (async not used; standard session per request). Connection and session factory in `database.py`; `get_db` is used as a FastAPI dependency.
- **Auth:** JWT access tokens (python-jose). Password hashing with bcrypt. Protected routes use `get_current_user` or `get_current_admin_user` from `auth.py`.
- **Config:** Pydantic Settings in `config.py`; reads from `.env` (e.g. `DATABASE_URL`, `JWT_SECRET_KEY`, `FRONTEND_ORIGIN`).
- **Static files:** Product images in `static/images/products/` are mounted at `/static` by `main.py`.

---

## Frontend overview

- **Stack:** React 18, Vite, React Router 6. No external UI library; styling in `App.css`.
- **Auth:** `AuthContext` stores user and provides `login`, `logout`, `register`, `updateProfile`, `deleteAccount`. JWT is kept in `localStorage` and sent via `api.js` for authenticated requests.
- **Routes:** Home (`/`), Products (`/products`), Product detail (`/products/:id`), Cart (`/cart`), Checkout (`/checkout`), Orders (`/orders`), Order detail (`/orders/:id`), Account (`/account`), Login (`/login`), Register (`/register`). Cart, Checkout, and Orders are protected (redirect to Account if not logged in).
- **Features:** Browse and search products, category filter, product reviews (add/edit/delete), cart (add/update/remove), checkout with shipping and simulated payment, order list with status stepper (Pending → Confirmed → Shipped → Delivered / Cancelled), account profile (update name/email/password, logout, delete account).

---

## API overview

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (body: `email`, `full_name?`, `password`). Password rules: 8+ chars, upper, lower, digit, special. |
| POST | `/auth/login` | Login (form: `username`=email, `password`). Returns `access_token`. |
| POST | `/auth/logout` | Logout (stateless; client discards token). |
| GET | `/auth/me` | Current user (requires Bearer token). |
| PATCH | `/auth/me` | Update profile (optional: `full_name`, `email`, `password`). |
| DELETE | `/auth/me` | Delete account and all related data (cart, orders, reviews). |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products/categories` | List categories (for filters). |
| GET | `/products` | List products. Optional: `?category=...`. |
| GET | `/products/search?q=...` | Search by keyword. |
| GET | `/products/{id}` | Product by ID. |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products/{id}/reviews` | Reviews for a product. |
| POST | `/products/{id}/reviews` | Add review (body: `comment`, `rating?` 1–5). Auth required. |
| GET | `/reviews/{id}` | Single review. |
| PUT | `/reviews/{id}` | Update own review. Auth required. |
| DELETE | `/reviews/{id}` | Delete own review. Auth required. |

### Cart (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get cart (items, totals). |
| POST | `/cart/items` | Add item (body: `product_id`, `quantity`). |
| PATCH | `/cart/items/{id}` | Update quantity (0 = remove). |
| DELETE | `/cart/items/{id}` | Remove item. |
| DELETE | `/cart` | Clear cart. |

### Orders (auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Place order (body: shipping fields + `payment`). Simulated payment; creates order, clears cart. |
| GET | `/orders` | List current user’s orders. |
| GET | `/orders/{id}` | Order detail with items. |
| PATCH | `/orders/{id}/status` | Update order status. **Admin only.** |

### Admin (admin user only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/products` | Create product. |
| POST | `/admin/products/bulk` | Create multiple products. |
| PUT | `/admin/products/{id}` | Update product. |
| DELETE | `/admin/products/{id}` | Delete product. |

Order status values: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

---

## Making a user admin

Admin endpoints require a user with `is_admin = true`. After registering (or for an existing user), run in PostgreSQL:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

Then use the same account to log in; the token will have admin rights for `/admin/*` and `PATCH /orders/{id}/status`.

---

## Typical usage flow

1. Register at `/register`, then sign in at `/login`.
2. Browse products on Home or `/products`; open a product and add to cart.
3. Go to Cart, adjust quantities, then Checkout (shipping + simulated payment).
4. After placing order, view Orders and order detail; status can be updated by an admin via `PATCH /orders/{id}/status`.
5. Account: update profile, log out, or delete account (DELETE `/auth/me`).

For product images, place files in `static/images/products/` and set `image_url` to `/static/images/products/filename.jpg` when creating products (via admin API or direct SQL).
