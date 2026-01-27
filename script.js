// 🔑 API-Ninjas AQI key
const NINJAS_KEY = "yjZzyHoaiJ4WAP14v9Ngafd0Hxvv56Y0Nfh2jK5L";

/* =========================
   MAP INITIALIZATION
========================= */
const map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let marker;

/* =========================
   MOVE MAP + AQI MARKER
========================= */
function moveMap(lat, lon, label, aqiText = "") {
  map.setView([lat, lon], 13);

  if (marker) map.removeLayer(marker);

  marker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup(`<b>${label}</b><br>${aqiText}`)
    .openPopup();
}

/* =========================
   AQI FETCH (API-NINJAS)
========================= */
function fetchAQIByCoords(lat, lon, label) {
  fetch(`https://api.api-ninjas.com/v1/airquality?lat=${lat}&lon=${lon}`, {
    headers: { "X-Api-Key": NINJAS_KEY }
  })
    .then(res => res.json())
    .then(data => {
      updateAQIUI(data.overall_aqi);

      document.getElementById("pm25").innerText = data["PM2.5"]?.concentration ?? "N/A";
      document.getElementById("pm10").innerText = data.PM10?.concentration ?? "N/A";
      document.getElementById("no2").innerText  = data.NO2?.concentration ?? "N/A";
      document.getElementById("o3").innerText   = data.O3?.concentration ?? "N/A";
      document.getElementById("co").innerText   = data.CO?.concentration ?? "N/A";
      document.getElementById("so2").innerText  = data.SO2?.concentration ?? "N/A";

      moveMap(lat, lon, label, `AQI: ${data.overall_aqi}`);
    })
    .catch(() => {
      document.getElementById("aqiBar").innerText = "AQI unavailable";
    });
}

/* =========================
   AQI UI
========================= */
function updateAQIUI(aqi) {
  const bar = document.getElementById("aqiBar");

  let color = "green";
  let status = "Good";

  if (aqi > 50 && aqi <= 100) {
    color = "orange";
    status = "Moderate";
  } else if (aqi > 100) {
    color = "red";
    status = "Poor";
  }

  bar.innerText = `AQI: ${aqi} (${status})`;
  bar.style.background = color;
}

/* =========================
   LIVE LOCATION (DEFAULT)
========================= */
function loadLiveLocation() {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      fetchAQIByCoords(lat, lon, "Your Location");
    },
    () => {
      // fallback
      searchCityWithCoords("Delhi");
    }
  );
}

/* =========================
   SEARCH CITY
========================= */
function searchCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) return;
  searchCityWithCoords(city);
}

function searchCityWithCoords(city) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) return alert("City not found");
      const lat = data[0].lat;
      const lon = data[0].lon;
      fetchAQIByCoords(lat, lon, city);
    });
}

/* =========================
   APP START
========================= */
loadLiveLocation();
