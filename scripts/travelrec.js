document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("travelForm");
  const results = document.getElementById("results");
  const spinner = document.getElementById("loadingSpinner");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const locationInput = document.getElementById("location").value.trim();
    const showWeather = document.getElementById("showWeather").checked;

    if (!locationInput) return;

    // Show spinner, clear results
    spinner.style.display = "block";
    results.innerHTML = "";
    document.getElementById("weatherInfo").style.display = "none";
    document.getElementById("weatherDetails").textContent = "";

    try {
      const apiKey = "d58409f7d83d46b4900418b06f019386";
      const { lat, lon, name } = await getCoordinates(locationInput, apiKey);
      const attractions = await getTouristAttractions(lat, lon, apiKey);
      displayAttractions(name, lat, lon, attractions);

      if (showWeather) {
        getWeather(name);
      }
    } catch (err) {
      console.error(err);
      results.innerHTML = `<p class="red-text center-align">Something went wrong. Try again.</p>`;
    } finally {
      spinner.style.display = "none";
    }
  });
});

async function getCoordinates(location, apiKey) {
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(location)}&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error("Location not found");
  }

  const feature = data.features[0];
  return {
    lat: feature.geometry.coordinates[1],
    lon: feature.geometry.coordinates[0],
    name: feature.properties.city || feature.properties.formatted
  };
}

async function getTouristAttractions(lat, lon, apiKey) {
  const categories = "tourism,tourism.information,tourism.attraction,tourism.sights";
  const radius = 15000;
  const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=21&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  return data.features.map((place) => {
    const placeLat = place.geometry.coordinates[1];
    const placeLon = place.geometry.coordinates[0];
    const distance = calculateDistance(lat, lon, placeLat, placeLon);

    return {
      name: place.properties.name || "Unnamed Attraction",
      type: place.properties.categories?.[1] || place.properties.categories?.[0] || "Tourist Spot",
      address: place.properties.formatted,
      distance: distance.toFixed(2),
      website: place.properties.website || null
    };
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function getWeather(city) {
  const apiKey = 'ec8571eba2540e381e0a3c423713c20c';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`;

  const weatherInfo = document.getElementById("weatherInfo");
  const weatherDetails = document.getElementById("weatherDetails");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      weatherDetails.textContent = "Weather data not available.";
      weatherInfo.style.display = "block";
      return;
    }

    const desc = data.weather[0].description;
    const temp = data.main.temp;
    const icon = data.weather[0].icon;

    weatherDetails.innerHTML = `
      <div class="valign-wrapper">
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png"
             alt="${desc}" style="margin-right: 1rem; width: 48px; height: 48px;" />
        <div><strong>${city}</strong>: ${temp.toFixed(1)}°F — ${desc}</div>
      </div>
    `;
    weatherInfo.style.display = "block";
  } catch (error) {
    console.error("Weather fetch error:", error);
    weatherDetails.textContent = "Error retrieving weather data.";
    weatherInfo.style.display = "block";
  }
}

function displayAttractions(locationName, userLat, userLon, places) {
  const results = document.getElementById("results");

  if (places.length === 0) {
    results.innerHTML = `<p class="grey-text center-align">No tourist spots found near "${locationName}".</p>`;
    return;
  }

  results.innerHTML = `<div class="col s12"><h5>Top tourist attractions near <strong>${locationName}</strong>:</h5></div>`;

  const row = document.createElement("div");
  row.className = "row";

  places.forEach((place) => {
    const col = document.createElement("div");
    col.className = "col s12"; // Force single-column layout

    col.innerHTML = `
      <div class="card hoverable">
        <div class="card-content">
          <span class="card-title">${place.name}</span>
          <p><strong>Address:</strong> ${place.address}</p>
          <p><strong>Distance:</strong> ${place.distance} km</p>
          ${place.website ? `<p><a href="${place.website}" target="_blank">Website</a></p>` : ""}
        </div>
      </div>
    `;

    row.appendChild(col);
  });

  results.appendChild(row);
}
