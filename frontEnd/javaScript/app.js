const form = document.getElementById('search-form');
const q = document.getElementById('q');
const card = document.getElementById('card');
const msg = document.getElementById('msg');

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

/* ---------------- Helpers ---------------- */

// 1) Celsius → texto
const c = (n) => `${Math.round(Number(n))}°C`;

// 2) Texto legible por código WMO
function codeToText(code){
    const map = {
        0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',
        45:'Niebla',48:'Niebla escarchada',
        51:'Llovizna ligera',53:'Llovizna',55:'Llovizna intensa',
        61:'Lluvia ligera',63:'Lluvia',65:'Lluvia intensa',
        66:'Lluvia helada',67:'Lluvia helada fuerte',
        71:'Nieve ligera',73:'Nieve',75:'Nieve intensa',77:'Granos de nieve',
        80:'Chubascos ligeros',81:'Chubascos',82:'Chubascos fuertes',
        85:'Chubascos de nieve',86:'Chubascos de nieve fuertes',
        95:'Tormenta',96:'Tormenta con granizo',99:'Tormenta fuerte con granizo'
    };
    return map[code] ?? 'Condición desconocida';
}

// 3) WMO → clase de Weather Icons (día/noche simple)
function codeToIcon(code, isDay = true){
    const map = {
        0:'sunny',1:'day-sunny-overcast',2:'cloudy-high',3:'cloudy',
        45:'fog',48:'fog',
        51:'sprinkle',53:'sprinkle',55:'sprinkle',
        61:'rain',63:'rain',65:'rain',
        66:'sleet',67:'sleet',
        71:'snow',73:'snow',75:'snow',77:'snow',
        80:'showers',81:'showers',82:'showers',
        85:'snow',86:'snow',
        95:'thunderstorm',96:'storm-showers',99:'storm-showers'
    };
    const base = map[code] ?? 'cloud';
    const prefix = isDay ? 'wi-day-' : 'wi-night-';
    return prefix + base;
}

// 4) Fondo según código
function codeToBgClass(code){
    if ([0,1].includes(code)) return 'bg-clear';
    if ([2,3].includes(code)) return 'bg-cloudy';
    if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'bg-rain';
    if ([71,73,75,77,85,86].includes(code)) return 'bg-snow';
    if ([45,48].includes(code)) return 'bg-fog';
    if ([95,96,99].includes(code)) return 'bg-storm';
    return '';
}
function applyBg(code){
    const cls = codeToBgClass(code);
    document.body.classList.remove('bg-clear','bg-cloudy','bg-rain','bg-snow','bg-fog','bg-storm');
    if (cls) document.body.classList.add(cls);
}

/* --------------- Búsqueda por ciudad --------------- */

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    card.classList.add('hidden');

    const city = q.value.trim();
    if (!city) return;

    try {
        // 1) Geocoding → lat/lon
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;
        const geoRes = await fetch(geoURL);
        if (!geoRes.ok) throw new Error('Error geocoding');
        const geo = await geoRes.json();
        if (!geo.results?.length){
        msg.textContent = 'No encontré esa ciudad.'; return;
        }
        const { latitude, longitude, name, country } = geo.results[0];

        // 2) Clima actual
        const wURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`;
        const wRes = await fetch(wURL);
        if (!wRes.ok) throw new Error('Error clima');
        const w = await wRes.json();

        const cNow = w.current;
        const tempC = Number(cNow.temperature_2m);
        const tempF = (tempC * 9) / 5 + 32;
        current = { tempC, tempF, isC: true };

        el.place.textContent = `${name}, ${country}`;
        el.desc.textContent  = codeToText(cNow.weather_code);
        el.temp.textContent  = Math.round(tempC);
        el.wind.textContent  = Math.round(cNow.wind_speed_10m);
        el.humidity.textContent = Math.round(cNow.relative_humidity_2m);

        // Icono (clase CSS)
        el.icon.className = `wi ${codeToIcon(cNow.weather_code, Boolean(cNow.is_day))}`;

        applyBg(cNow.weather_code);
        card.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        msg.textContent = 'Hubo un error. Intenta más tarde.';
    }
});

/* --------------- Toggle C / F --------------- */

el.unitBtn.addEventListener('click', () => {
    current.isC = !current.isC;
    el.unitBtn.textContent = current.isC ? 'C' : 'F';
    el.temp.textContent = Math.round(current.isC ? current.tempC ?? 0 : current.tempF ?? 0);
});

/* --------------- Geolocalización al cargar --------------- */

(async function loadByGeo(){
    if (!('geolocation' in navigator)) return;
    try {
        const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 7000 })
        );
        const { latitude, longitude } = pos.coords;

        const wURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&timezone=auto`;
        const wRes = await fetch(wURL);
        if (!wRes.ok) throw new Error('Error clima geo');
        const w = await wRes.json();

        // Inverse geocoding para mostrar nombre
        const revURL = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=es&format=json`;
        const rRes = await fetch(revURL);
        const r = rRes.ok ? await rRes.json() : null;
        const place = r?.results?.[0] ? `${r.results[0].name}, ${r.results[0].country}` : 'Tu ubicación';

        const cNow = w.current;
        const tempC = Number(cNow.temperature_2m);
        const tempF = (tempC * 9) / 5 + 32;
        current = { tempC, tempF, isC: true };

        el.place.textContent = place;
        el.desc.textContent  = codeToText(cNow.weather_code);
        el.temp.textContent  = Math.round(tempC);
        el.wind.textContent  = Math.round(cNow.wind_speed_10m);
        el.humidity.textContent = Math.round(cNow.relative_humidity_2m);
        el.icon.className = `wi ${codeToIcon(cNow.weather_code, Boolean(cNow.is_day))}`;

        applyBg(cNow.weather_code);
        card.classList.remove('hidden');
        } catch (e) {
            console.debug('Geo no disponible:', e?.message);
        }
})();


