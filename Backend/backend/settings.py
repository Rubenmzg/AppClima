# backend/settings.py
import os

INSTALLED_APPS = [
    # ...
    "corsheaders",   # <-- NUEVO
    "weather",       # <-- NUEVO (después de crear la app; si no existe aún, vuelve y añádelo)
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # <-- NUEVO (arriba en la lista)
    # ... resto
]

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",  # Live Server VSCode
    "http://localhost:5500",
]

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

OPENWEATHER_KEY = os.environ.get("OPENWEATHER_KEY")

# Cache simple para evitar rate limits
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "owm-cache",
    }
}
