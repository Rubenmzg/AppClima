const form = document.getElementById('search-form');
const q = document.getElementById('q');
const card = document.getElementById('card');
const msg = document.getElementById('msg');

// --- Helpers que faltan ---

// 1) Formatear temperaturas a °C
const c = (n) => `${Math.round(Number(n))}°C`;

// 2) Mapear códigos de clima a un nombre de icono (WMO – Open‑Meteo)
const WMO_ICON = {
    0:  'clear',            // despejado
    1:  'mainly-clear',
    2:  'partly-cloudy',
    3:  'overcast',
    45: 'fog',
    48: 'fog',
    51: 'drizzle',
    53: 'drizzle',
    55: 'drizzle',
    56: 'freezing-drizzle',
    57: 'freezing-drizzle',
    61: 'rain',
    63: 'rain',
    65: 'rain',
    66: 'freezing-rain',
    67: 'freezing-rain',
    71: 'snow',
    73: 'snow',
    75: 'snow',
    77: 'snow-grains',
    80: 'rain-showers',
    81: 'rain-showers',
    82: 'rain-showers',
    85: 'snow-showers',
    86: 'snow-showers',
    95: 'thunderstorm',
    96: 'thunderstorm-hail',
    99: 'thunderstorm-hail',
};

// Devuelve la clase o nombre de icono según código e info día/noche si lo necesitas
function codeToIcon(code, isDay = true) {
    const key = Number(code);
    const base = WMO_ICON[key] ?? 'unknown';
  // si usas librería de iconos, ajusta aquí el nombre final
  // Por ejemplo con Weather Icons: `wi-day-...` / `wi-night-...`
    if (base === 'unknown') return isDay ? 'wi-day-sunny' : 'wi-night-clear';

  // ejemplo con Weather Icons:
    const prefix = isDay ? 'wi-day-' : 'wi-night-';
    const mapToWi = {
        'clear': 'sunny',
        'mainly-clear': 'sunny-overcast',
        'partly-cloudy': 'cloudy-high',
        'overcast': 'cloudy',
        'fog': 'fog',
        'drizzle': 'sprinkle',
        'freezing-drizzle': 'sleet',
        'rain': 'rain',
        'freezing-rain': 'sleet',
        'snow': 'snow',
        'snow-grains': 'snow',
        'rain-showers': 'showers',
        'snow-showers': 'snow',
        'thunderstorm': 'thunderstorm',
        'thunderstorm-hail': 'storm-showers',
    };
    const wi = mapToWi[base] ?? 'cloud';
    return `${prefix}${wi}`;
}

const el = {
    place: document.getElementById('place'),
    desc: document.getElementById('desc'),
    temp: document.getElementById('temp'),
    wind: document.getElementById('wind'),
    humidity: document.getElementById('humidity'),
    icon: document.getElementById('icon'),
    unitBtn: document.getElementById('unit'),
};

let current = { tempC: null, tempF: null, isC: true };

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    card.classList.add('hidden');

    const city = q.value.trim();
    if (!city) return;

    try {
        // 1) geocodificar ciudad -> lat/lon (Open-Meteo geocoding, sin key)
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;
        const geoRes = await fetch(geoURL);
        if (!geoRes.ok) throw new Error('Error al geocodificar');
        const geo = await geoRes.json();
        if (!geo.results || geo.results.length === 0) {
        msg.textContent = 'No encontré esa ciudad.';
        return;
        }
        const { latitude, longitude, name, country } = geo.results[0];

        // 2) pedir clima actual
        const wURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
        const wRes = await fetch(wURL);
        if (!wRes.ok) throw new Error('Error al obtener el clima');
        const w = await wRes.json();

        const c = w.current;
        const tempC = c.temperature_2m;
        const tempF = (tempC * 9) / 5 + 32;

        current = { tempC, tempF, isC: true };

        el.place.textContent = `${name}, ${country}`;
        el.temp.textContent = Math.round(tempC);
        el.wind.textContent = Math.round(c.wind_speed_10m);
        el.humidity.textContent = Math.round(c.relative_humidity_2m);
        el.desc.textContent = codeToText(c.weather_code);
        el.icon.src = codeToIcon(c.weather_code);
        el.icon.alt = el.desc.textContent;

        card.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        msg.textContent = 'Hubo un error. Intenta más tarde.';
    }
});

// Cambiar C / F
el.unitBtn.addEventListener('click', () => {
    current.isC = !current.isC;
    if (current.isC) {
        el.unitBtn.textContent = 'C';
        el.temp.textContent = Math.round(current.tempC ?? 0);
    } else {
        el.unitBtn.textContent = 'F';
        el.temp.textContent = Math.round(current.tempF ?? 0);
    }
});

// Helpers: traducir códigos a texto e ícono
function codeToText(code) {
    const map = {
        0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
        45: 'Niebla', 48: 'Niebla escarchada',
        51: 'Llovizna ligera', 53: 'Llovizna', 55: 'Llovizna intensa',
        61: 'Lluvia ligera', 63: 'Lluvia', 65: 'Lluvia intensa',
        71: 'Nieve ligera', 73: 'Nieve', 75: 'Nieve intensa',
        80: 'Chubascos ligeros', 81: 'Chubascos', 82: 'Chubascos fuertes',
        95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte con granizo'
    };
    return map[code] ?? 'Condición desconocida';
}

// === NUEVO: decide qué clase de fondo usar según weather_code ===
function codeToBgClass(code) {
    if ([0,1].includes(code)) return 'bg-clear';
    if ([2].includes(code) || [3].includes(code)) return 'bg-cloudy';
    if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'bg-rain';
    if ([71,73,75].includes(code)) return 'bg-snow';
    if ([45,48].includes(code)) return 'bg-fog';
    if ([95,96,99].includes(code)) return 'bg-storm';
  return ''; // default
}

function applyBg(code){
    const cls = codeToBgClass(code);
    document.body.classList.remove('bg-clear','bg-cloudy','bg-rain','bg-snow','bg-fog','bg-storm');
    if (cls) document.body.classList.add(cls);
}

// === EXISTENTE: al cargar datos, después de setear icon/desc, agrega: ===
// el.icon.src = ...
// el.icon.alt = ...
// -> añade:
applyBg(c.weather_code);

// === NUEVO: geolocalización al cargar página ===
(async function loadByGeo(){
    if (!('geolocation' in navigator)) return;
    try {
        await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 7000 });
        }).then(async (pos) => {
        const { latitude, longitude } = pos.coords;

        // pides clima directo por coords
        const wURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
        const wRes = await fetch(wURL);
        if (!wRes.ok) throw new Error('Error clima geo');
        const w = await wRes.json();

        // opcional: invertir geocoding para nombre de ciudad
        const revURL = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=es&format=json`;
        const rRes = await fetch(revURL);
        const r = rRes.ok ? await rRes.json() : null;
        const place = r?.results?.[0] ? `${r.results[0].name}, ${r.results[0].country}` : 'Tu ubicación';

        const c = w.current;
        const tempC = c.temperature_2m;
        const tempF = (tempC * 9) / 5 + 32;
        current = { tempC, tempF, isC: true };

        el.place.textContent = place;
        el.temp.textContent = Math.round(tempC);
        el.wind.textContent = Math.round(c.wind_speed_10m);
        el.humidity.textContent = Math.round(c.relative_humidity_2m);
        el.desc.textContent = codeToText(c.weather_code);
        el.icon.src = codeToIcon(c.weather_code);
        el.icon.alt = el.desc.textContent;
        applyBg(c.weather_code);
        card.classList.remove('hidden');
        });
    } catch (e) {
        // silencio si el usuario niega permisos o falla
        console.debug('Geo no disponible:', e?.message);
    }
})();



