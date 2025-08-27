import requests
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.http import require_GET

OWM_BASE_2_5 = "https://api.openweathermap.org/data/2.5"
GEO_BASE = "http://api.openweathermap.org/geo/1.0"

def _key():
    k = settings.OPENWEATHER_KEY
    if not k:
        raise RuntimeError("Falta OPENWEATHER_KEY")
    return k

def _cached_get(url, params, ttl=300):
    ck = f"{url}:{sorted(params.items())}"
    data = cache.get(ck)
    if data:
        return data, 200
    r = requests.get(url, params=params, timeout=15)
    js = r.json()
    cache.set(ck, js, ttl)
    return js, r.status_code

@require_GET
def weather_view(request):
    key = _key()
    q   = request.GET.get("q")
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    units = request.GET.get("units", "metric")
    lang  = request.GET.get("lang", "es")

    if not q and not (lat and lon):
        return JsonResponse({"error": "Falta q o lat/lon"}, status=400)

    params = {"appid": key, "units": units, "lang": lang}
    if q:
        params["q"] = q
    else:
        params["lat"] = lat
        params["lon"] = lon

    data, status = _cached_get(f"{OWM_BASE_2_5}/weather", params)
    return JsonResponse(data, status=status, safe=False)

@require_GET
def forecast_view(request):
    key = _key()
    q   = request.GET.get("q")
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    units = request.GET.get("units", "metric")
    lang  = request.GET.get("lang", "es")

    if not q and not (lat and lon):
        return JsonResponse({"error": "Falta q o lat/lon"}, status=400)

    params = {"appid": key, "units": units, "lang": lang}
    if q:
        params["q"] = q
    else:
        params["lat"] = lat
        params["lon"] = lon

    data, status = _cached_get(f"{OWM_BASE_2_5}/forecast", params)
    return JsonResponse(data, status=status, safe=False)

@require_GET
def search_city_view(request):
    key = _key()
    name = request.GET.get("name", "")
    limit = request.GET.get("limit", "5")
    if not name:
        return JsonResponse([], safe=False)

    params = {"appid": key, "q": name, "limit": limit}
    data, status = _cached_get(f"{GEO_BASE}/direct", params, ttl=3600)
    return JsonResponse(data, status=status, safe=False)
