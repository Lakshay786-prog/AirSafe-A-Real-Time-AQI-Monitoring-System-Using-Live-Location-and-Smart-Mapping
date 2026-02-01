const NINJAS_KEY = "yjZzyHoaiJ4WAP14v9Ngafd0Hxvv56Y0Nfh2jK5L";

let map, marker, weeklyChart;

/* =========================
   APP START
========================= */
document.addEventListener("DOMContentLoaded", () => {

  map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  document.getElementById("searchBtn").addEventListener("click", searchCity);
  document.getElementById("cityInput").addEventListener("keydown", e => {
    if (e.key === "Enter") searchCity();
  });

  loadLiveLocation();
});

/* =========================
   AQI UI + PRECAUTION
========================= */
function updateAQIUI(aqi, city) {
  document.getElementById("aqiValue").innerText = aqi;
  document.getElementById("cityName").innerText = city;

  const circle = document.getElementById("aqiCircle");
  let color = "#22c55e";
  if (aqi > 50 && aqi <= 100) color = "#facc15";
  else if (aqi > 100) color = "#ef4444";
  circle.style.background = color;

  updatePrecautionByAQI(aqi);
}

function updatePrecautionByAQI(aqi) {
  const box = document.getElementById("precautionBox");
  const text = document.getElementById("precautionText");
  const icon = document.getElementById("precautionIcon");

  box.className = "precaution";

  if (aqi <= 50) {
    box.classList.add("good");
    icon.textContent = "😊";
    text.innerHTML = "Good air quality. Safe for outdoor activities.";
  } else if (aqi <= 100) {
    box.classList.add("moderate");
    icon.textContent = "😷";
    text.innerHTML = "Moderate air quality. Sensitive people take care.";
  } else {
    box.classList.add("poor");
    icon.textContent = "🚨";
    text.innerHTML = "Poor air quality. Avoid outdoor activity & wear mask.";
  }
}

/* =========================
   MAP
========================= */
function moveMap(lat, lon, label, aqi) {
  map.setView([lat, lon], 13);
  if (marker) map.removeLayer(marker);

  let cls = "marker-good";
  if (aqi > 50 && aqi <= 100) cls = "marker-moderate";
  else if (aqi > 100) cls = "marker-poor";

  const icon = L.divIcon({
    html: `<div class="aqi-marker ${cls}"></div>`,
    iconSize: [20, 20]
  });

  marker = L.marker([lat, lon], { icon })
    .addTo(map)
    .bindPopup(`<b>${label}</b><br>AQI: ${aqi}`)
    .openPopup();
}

/* =========================
   AQI FETCH
========================= */
function fetchAQI(lat, lon, label) {
  fetch(`https://api.api-ninjas.com/v1/airquality?lat=${lat}&lon=${lon}`, {
    headers: { "X-Api-Key": NINJAS_KEY }
  })
    .then(res => res.json())
    .then(data => {
      const aqi = data.overall_aqi;

      updateAQIUI(aqi, label);

      document.getElementById("pm25").innerText = data["PM2.5"]?.concentration ?? "N/A";
      document.getElementById("pm10").innerText = data.PM10?.concentration ?? "N/A";
      document.getElementById("no2").innerText  = data.NO2?.concentration ?? "N/A";
      document.getElementById("o3").innerText   = data.O3?.concentration ?? "N/A";
      document.getElementById("co").innerText   = data.CO?.concentration ?? "N/A";
      document.getElementById("so2").innerText  = data.SO2?.concentration ?? "N/A";

      saveAQI(label, aqi);
      renderWeeklyChart(label);
      moveMap(lat, lon, label, aqi);
    });
}

/* =========================
   LIVE LOCATION
========================= */
function loadLiveLocation() {
  navigator.geolocation.getCurrentPosition(
    pos => fetchAQI(pos.coords.latitude, pos.coords.longitude, "Your Location"),
    () => searchCity("Delhi")
  );
}

/* =========================
   SEARCH CITY
========================= */
function searchCity(defaultCity) {
  const city = defaultCity || cityInput.value;
  if (!city) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) return alert("City not found");
      fetchAQI(data[0].lat, data[0].lon, city);
    });
}

/* =========================
   WEEKLY AQI STORAGE
========================= */
function saveAQI(location, aqi) {
  const today = new Date().toISOString().split("T")[0];
  let store = JSON.parse(localStorage.getItem("weeklyAQI")) || {};
  store[location] = store[location] || [];

  if (!store[location].find(d => d.date === today)) {
    store[location].push({ date: today, aqi });
  }
  if (store[location].length > 7) store[location].shift();

  localStorage.setItem("weeklyAQI", JSON.stringify(store));
}

/* =========================
   WEEKLY CHART
========================= */
function renderWeeklyChart(location) {
  const store = JSON.parse(localStorage.getItem("weeklyAQI")) || {};
  const data = store[location] || [];

  const labels = data.map(d => d.date);
  const values = data.map(d => d.aqi);

  const ctx = document.getElementById("aqiChart").getContext("2d");
  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Weekly AQI – ${location}`,
        data: values,
        borderWidth: 3,
        tension: 0.4,
        fill: true
      }]
    }
  });
}
