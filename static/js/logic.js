// Setting up the Leaflet map beginning on Buenas Aires, Argentina
let world = L.map('map').setView([-34, -58], 4); 
// Adding a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors'
}).addTo(world);

// Creating a layer group for earthquake markers
let tremorsLayerGroup = L.layerGroup();

// Retrieving the earthquake data for the API from USGS
fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_month.geojson')
  .then(response => response.json())
  .then(data => {
    console.log('Earthquake data received:', data);

    // Processing the received data
    let tremors = data.features.map(feature => ({
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      depth: feature.geometry.coordinates[2],
      coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] 
    }));

    console.log('Processed earthquakes:', tremors);

    // Creating a function to calculate depth based on marker color
    let getMarkerColor = depth => {
      let depthRanges = [0, 15, 30, 45, 60, 90];
      let colorRanges = ['#00FF00', '#9ACD32', '#FFD700', '#FFA500', '#FF4500', '#FF0000'];

      // Iterate through depth ranges to find a color for each depth
      for (let i = 0; i < depthRanges.length - 1; i++) {
        if (depth >= depthRanges[i] && depth < depthRanges[i + 1]) {
          return colorRanges[i];
        }
      }
      return colorRanges[colorRanges.length - 1];
    };

    // Calculating marker radius using earthquake magnitude
    let getMarkerRadius = magnitude => {
      let scalingFactor = 35;
      let minRadius = 5;
      let maxRadius = 200;

      // Calculate earthquake radius based on logarithm of magnitude
      let radius = Math.log10(magnitude) * scalingFactor;
      return Math.max(minRadius, Math.min(radius, maxRadius));
    };

    // Add markers to layer group
    tremors.forEach(earthquake => {
      let circleMarker = L.circleMarker(earthquake.coordinates, {
        radius: getMarkerRadius(earthquake.magnitude),
        fillColor: getMarkerColor(earthquake.depth),
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
      })
        .bindPopup(`Magnitude: ${earthquake.magnitude}<br>Location: ${earthquake.location}<br>Depth: ${earthquake.depth} km`)
        .addTo(tremorsLayerGroup);

      // Update marker radius during zoom
      world.on('zoomend', () => {
        circleMarker.setRadius(getMarkerRadius(earthquake.magnitude));
      });
    });

    // Adding layer group to the map
    tremorsLayerGroup.addTo(world);

    console.log('Added markers to map.');
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Adding a legend control for legibility (programmer pun!)
let legend = L.control({ position: 'bottomright' });

// Defining legend content and colors
legend.onAdd = function (world) {
  let div = L.DomUtil.create('div', 'legend');
  let depthRanges = [0, 15, 30, 45, 60, 90];

  div.innerHTML += '<div class="legend-title">Depth Range</div>';

  // Iterating through depth ranges to create legend boxes and labels.
  // I had a hard time with this ability and needed to get help to figure it out.
  for (let i = 0; i < depthRanges.length; i++) {
    let rangeStart = depthRanges[i];
    let rangeEnd = depthRanges[i + 1] ? depthRanges[i + 1] : '+';
    let color = getMarkerColor(rangeStart);

    let box = `<span class="legend-color" style="background: ${color}"></span>`;
    let label = `<span class="legend-label">${rangeStart} - ${rangeEnd}</span>`;

    // Create a legend item with color box & label
    div.innerHTML += `<div>${box}${label}</div>`;
  }

  return div;
};

// Adding the map's legend control!
legend.addTo(world);