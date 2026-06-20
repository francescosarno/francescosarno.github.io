(function () {
	document.addEventListener("DOMContentLoaded", function () {
		if (!window.cityData || typeof L === "undefined") return;
		var params = new URLSearchParams(window.location.search);
		var slug = params.get("city");
		var city = window.cityData[slug];
		var cityGuideData = window.cityGuideData || { photos: [], highlights: [], food: [], itinerary: [], stay: [] };
		if (!city) return;
		document.title = "Francesco Sarno | " + city.name;
		document.getElementById("city-title").textContent = city.name;
		document.getElementById("city-subtitle").textContent = city.country;
		document.getElementById("city-nav-title").textContent = city.name;
		document.getElementById("city-intro").textContent = "A travel guide in progress for " + city.name + ", designed to make planning a future visit easy and intuitive.";
		var cityMap = L.map("city-map", { scrollWheelZoom: true, zoomControl: true }).setView(city.coords, 12);
		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			minZoom: 2,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(cityMap);
		var guideLayer = L.layerGroup().addTo(cityMap);
		L.circleMarker(city.coords, { radius: 8, color: "#17314f", weight: 2, fillColor: "#7ea6d9", fillOpacity: 0.95 }).bindPopup(city.name).addTo(guideLayer);
		[cityGuideData.photos, cityGuideData.highlights, cityGuideData.food, cityGuideData.stay].forEach(function (group) {
			group.forEach(function (place) {
				if (!place.coords) return;
				L.marker(place.coords).bindPopup(place.name).addTo(guideLayer);
			});
		});
		if (!city.wiki) return;
		fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(city.wiki))
			.then(function (response) { return response.ok ? response.json() : null; })
			.then(function (data) {
				if (!data || !data.originalimage || !data.originalimage.source) return;
				var heroImage = document.getElementById("city-hero-image");
				heroImage.src = data.originalimage.source;
				heroImage.alt = city.name + " city view";
			})
			.catch(function () {});
	});
})();
