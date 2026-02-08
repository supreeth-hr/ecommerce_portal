from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import settings
from .database import Base, engine
from .routers import admin as admin_router
from .routers import auth as auth_router
from .routers import products as products_router
from .routers import cart as cart_router
from .routers import orders as orders_router
from .routers import reviews as reviews_router


def create_app() -> FastAPI:
    app = FastAPI(title="Shoppy")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Static files for product images
    static_dir = Path(__file__).parent.parent.parent / "static"
    static_dir.mkdir(exist_ok=True)
    (static_dir / "images" / "products").mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    # Routers
    app.include_router(auth_router.router)
    app.include_router(products_router.router)
    app.include_router(cart_router.router)
    app.include_router(orders_router.router)
    app.include_router(reviews_router.router)
    app.include_router(admin_router.router)

    return app


app = create_app()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)