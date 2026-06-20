(function () {
	document.addEventListener("DOMContentLoaded", function () {
		if (!window.travelLocations || typeof L === "undefined") return;
		var map = L.map("travel-map", { scrollWheelZoom: true, zoomControl: true }).setView([20, 0], 2);
		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			minZoom: 2,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
		var bounds = [];
		var detailCard = document.getElementById("travel-country-detail");
		var detailTitle = document.getElementById("travel-country-detail-title");
		var detailCities = document.getElementById("travel-country-detail-cities");
		var closeButton = document.getElementById("travel-country-close");
		var mapFrame = document.getElementById("travel-map");
		var markerLayer = L.layerGroup().addTo(map);
		var countryCenters = {};
		var countryAreas = {};
		var countryGeoJsonLayer = null;
		var countryColors = window.countryColors || {};
		var countryNameMap = window.countryNameMap || {};
		window.travelLocations.forEach(function (location) {
			bounds.push(location.coords);
			if (!countryCenters[location.country]) countryCenters[location.country] = [];
			countryCenters[location.country].push(location.coords);
			var colorSet = countryColors[location.country] || { primary: "#2f618e", fill: "#8fb6d8" };
			var cityPage = "city.html?city=" + encodeURIComponent(location.slug);
			var area = L.circleMarker(location.coords, { radius: 7, color: colorSet.primary, weight: 2, fillColor: colorSet.fill, fillOpacity: 0.9 });
			area.bindTooltip(location.name, { direction: "top", offset: [0, -8] });
			area.on("click", function () { window.location.href = cityPage; });
			if (!countryAreas[location.country]) countryAreas[location.country] = [];
			countryAreas[location.country].push(area);
		});
		if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
		var visitedCountries = new Set(window.travelLocations.map(function (location) { return countryNameMap[location.country] || location.country; }));
		var groupedLocations = {};
		window.travelLocations.forEach(function (location) {
			var country = location.country || "Other";
			if (!groupedLocations[country]) groupedLocations[country] = [];
			groupedLocations[country].push(location);
		});
		function resetCountryStyles() {
			if (!countryGeoJsonLayer) return;
			countryGeoJsonLayer.eachLayer(function (layer) {
				var layerInternalCountry = Object.keys(countryNameMap).find(function (key) { return countryNameMap[key] === layer.feature.properties.name; }) || layer.feature.properties.name;
				var layerColorSet = countryColors[layerInternalCountry] || { primary: "#2f618e", fill: "#8fb6d8" };
				var isVisited = visitedCountries.has(layer.feature.properties.name);
				layer.setStyle({ color: isVisited ? layerColorSet.primary : "#cfd9e4", weight: isVisited ? 1.2 : 0.7, fillColor: isVisited ? layerColorSet.fill : "#f5f8fc", fillOpacity: isVisited ? 0.55 : 0.18 });
			});
		}
		function openCountryDetail(country) {
			if (!groupedLocations[country]) return;
			markerLayer.clearLayers();
			detailCard.hidden = false;
			detailTitle.textContent = country;
			detailCities.innerHTML = "";
			mapFrame.classList.add("travel-map-frame-expanded");
			countryAreas[country].forEach(function (area) { area.addTo(markerLayer); });
			groupedLocations[country].forEach(function (city) {
				var item = document.createElement("li");
				var link = document.createElement("a");
				link.href = "city.html?city=" + encodeURIComponent(city.slug);
				link.textContent = city.name;
				item.appendChild(link);
				detailCities.appendChild(item);
			});
			map.fitBounds(L.latLngBounds(countryCenters[country]), { padding: [40, 40], maxZoom: 6 });
			if (!countryGeoJsonLayer) return;
			var targetName = countryNameMap[country] || country;
			countryGeoJsonLayer.eachLayer(function (layer) {
				var layerInternalCountry = Object.keys(countryNameMap).find(function (key) { return countryNameMap[key] === layer.feature.properties.name; }) || layer.feature.properties.name;
				var layerColorSet = countryColors[layerInternalCountry] || { primary: "#2f618e", fill: "#8fb6d8" };
				var isTarget = layer.feature && layer.feature.properties && layer.feature.properties.name === targetName;
				var isVisited = visitedCountries.has(layer.feature.properties.name);
				layer.setStyle({
					color: isTarget ? "#17314f" : (isVisited ? layerColorSet.primary : "#cfd9e4"),
					weight: isTarget ? 2 : (isVisited ? 1.2 : 0.7),
					fillColor: isTarget ? layerColorSet.primary : (isVisited ? layerColorSet.fill : "#f5f8fc"),
					fillOpacity: isTarget ? 0.72 : (isVisited ? 0.55 : 0.18)
				});
			});
		}
		function closeCountryDetail() {
			detailCard.hidden = true;
			detailTitle.textContent = "";
			detailCities.innerHTML = "";
			mapFrame.classList.remove("travel-map-frame-expanded");
			markerLayer.clearLayers();
			if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
			resetCountryStyles();
		}
		fetch("https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json")
			.then(function (response) { return response.json(); })
			.then(function (data) {
				countryGeoJsonLayer = L.geoJSON(data, {
					style: function (feature) {
						var visited = visitedCountries.has(feature.properties.name);
						var internalCountry = Object.keys(countryNameMap).find(function (key) { return countryNameMap[key] === feature.properties.name; }) || feature.properties.name;
						var colorSet = countryColors[internalCountry] || { primary: "#2f618e", fill: "#8fb6d8" };
						return { color: visited ? colorSet.primary : "#cfd9e4", weight: visited ? 1.2 : 0.7, fillColor: visited ? colorSet.fill : "#f5f8fc", fillOpacity: visited ? 0.55 : 0.18 };
					},
					onEachFeature: function (feature, layer) {
						if (!visitedCountries.has(feature.properties.name)) return;
						layer.on("click", function () {
							var internalCountry = Object.keys(countryNameMap).find(function (key) { return countryNameMap[key] === feature.properties.name; }) || feature.properties.name;
							openCountryDetail(internalCountry);
						});
					}
				}).addTo(map);
			})
			.catch(function () {});
		closeButton.addEventListener("click", closeCountryDetail);
	});
})();
