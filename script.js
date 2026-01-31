const NINJAS_KEY = "yjZzyHoaiJ4WAP14v9Ngafd0Hxvv56Y0Nfh2jK5L";

let map, marker;

document.addEventListener("DOMContentLoaded", () => {

  // Map init AFTER DOM
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

/* AQI UI */
function updateAQIUI(aqi, city) {
  const circle = document.getElementById("aqiCircle");
  document.getElementById("aqiValue").innerText = aqi;
  document.getElementById("cityName").innerText = city;

  let color = "#22c55e";
  if (aqi > 50 && aqi <= 100) color = "#facc15";
  else if (aqi > 100) color = "#ef4444";

  circle.style.background = color;
}

/* Map move */
function moveMap(lat, lon, label, aqi) {
  map.setView([lat, lon], 13);

  if (marker) map.removeLayer(marker);

  let className = "marker-good";
  if (aqi > 50 && aqi <= 100) className = "marker-moderate";
  else if (aqi > 100) className = "marker-poor";

  const icon = L.divIcon({
    className: "",
    html: `<div class="aqi-marker ${className}"></div>`,
    iconSize: [20, 20]
  });

  marker = L.marker([lat, lon], { icon })
    .addTo(map)
    .bindPopup(`<b>${label}</b><br>AQI: ${aqi}`)
    .openPopup();
}


/* AQI fetch */
function fetchAQI(lat, lon, label) {
  fetch(`https://api.api-ninjas.com/v1/airquality?lat=${lat}&lon=${lon}`, {
    headers: { "X-Api-Key": NINJAS_KEY }
  })
    .then(res => res.json())
    .then(data => {
      updateAQIUI(data.overall_aqi, label);

      pm25.innerText = data["PM2.5"]?.concentration ?? "N/A";
      pm10.innerText = data.PM10?.concentration ?? "N/A";
      no2.innerText  = data.NO2?.concentration ?? "N/A";
      o3.innerText   = data.O3?.concentration ?? "N/A";
      co.innerText   = data.CO?.concentration ?? "N/A";
      so2.innerText  = data.SO2?.concentration ?? "N/A";

      moveMap(lat, lon, label, data.overall_aqi);
    });
}

/* Live location */
function loadLiveLocation() {
  navigator.geolocation.getCurrentPosition(
    pos => fetchAQI(pos.coords.latitude, pos.coords.longitude, "Your Location"),
    () => searchCity("Delhi")
  );
}

/* City search */
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

