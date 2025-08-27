from django.urls import path
from .views import weather_view, forecast_view, search_city_view

urlpatterns = [
    path("weather/", weather_view, name="weather"),
    path("forecast/", forecast_view, name="forecast"),
    path("search/", search_city_view, name="search"),
]
