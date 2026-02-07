from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/ecommerce_db"

    # JWT
    jwt_secret_key: str = "CHANGE_ME_SECRET_KEY"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS / Frontend
    frontend_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

