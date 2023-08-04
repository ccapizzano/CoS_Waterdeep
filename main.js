/* global L Papa */

/*
//  * Script to display two tables from Google Sheets as point and geometry layers using Leaflet
//  * The Sheets are then imported using PapaParse and overwrite the initially laded layers
 */

// PASTE YOUR URLs HERE
// these URLs come from Google Sheets 'shareable link' form
// the first is the geometry layer and the second the points
// let geomURL =
//   'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGB2YPDc_F5szLKIv66aJWxJ_v4YHKjbx0tBPa0IXEFWaU0sQnPHTQ_e_IF4jc8PVqBlidyNVLYyyh/pub?output=csv';
let pointsURL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSW7of5m8UoPrBQT8BAPzSyzBF852GpQ6MNXlOOZSM1S4ta1iRwjV3qKJ3Qhv_lmtp1sb8heo2UYLJ6/pub?output=csv';

window.addEventListener("DOMContentLoaded", init);

let map;
// let sidebar;
let panelID = "my-info-panel";

/*
//  * init() is called when the page has loaded
 */
function init() {

  // Create a new Leaflet map centered on the Waterdeep map
  // var map = L.map('map').setView([33.43144133557529, -102.65625000000001], 3);
  var map = L.map('map', {
    crs: L.CRS.Simple,
    zoomSnap: 0.1,
  });

  var bounds = [
    [0, 0],
    [-226.78533150541517, 111.26418424076424]
  ]

  map.fitBounds(bounds)

  // Setup Waterdeep tile layer
  L.tileLayer('map/{z}/{x}/{y}.png', {
    continuousWorld: false,
    noWrap: true,
    minZoom: 0,
    maxZoom: 8,
  }).addTo(map);

  // Display coordinates
  L.control.coordinates({
    position: "bottomleft",
    decimals: 2,
    decimalSeperator: ".",
    labelTemplateLat: "Y: {y}",
    labelTemplateLng: "X: {x}",
    useLatLngOrder: true
  }).addTo(map);

  // Draw toolbar
  var featureGroup = L.featureGroup().addTo(map);

  var drawControl = new L.Control.Draw({
    draw: {
      polygon: {
        allowIntersection: false, // Restricts shapes to simple polygons
        drawError: {
          color: 'red', // Color the shape will turn when intersects
          message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
        },
        shapeOptions: {
          color: '#6b006e'
        }
      },
      rectangle: {
        allowIntersection: false, // Restricts shapes to simple polygons
        drawError: {
          color: '#e1e100', // Color the shape will turn when intersects
          message: '<strong>Oh snap!<strong> you can\'t draw that!' // Message that will show when intersect
        },
        shapeOptions: {
          color: '#6b006e'
        }
      },
      polyline: true,
      circle: false,
      circlemarker: false,
      marker: false
    },
    edit: {
      featureGroup: featureGroup
    }
  }).addTo(map);

  map.on('draw:created', function (e) {

    // Each time a feaute is created, it's added to the over arching feature group
    featureGroup.addLayer(e.layer);
  });

  // on click, clear all layers
  document.getElementById('delete').onclick = function (e) {
    featureGroup.clearLayers();
  }

  document.getElementById('export').onclick = function (e) {
    // Extract GeoJson from featureGroup
    var data = featureGroup.toGeoJSON();

    // Stringify the GeoJson
    var convertedData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));

    // Create export
    document.getElementById('export').setAttribute('href', 'data:' + convertedData);
    document.getElementById('export').setAttribute('download', 'data.geojson');
  }

  // Sidebar
  // sidebar = L.control
  //   .sidebar({
  //     container: "sidebar",
  //     closeButton: true,
  //     position: "right",
  //   }).addTo(map);

  // let panelContent = {
  //   id: panelID,
  //   tab: "<i class='fa fa-bars active'></i>",
  //   pane: "<p id='sidebar-content'></p>",
  //   title: "<h2 id='sidebar-title'>Nothing selected</h2>",
  // };
  // sidebar.addPanel(panelContent);

  // map.on("click", function () {
  //   sidebar.close(panelID);
  // });

  // Use PapaParse to load data from Google Sheets
  // And call the respective functions to add those to the map.
  Papa.parse(pointsURL, {
    download: true,
    header: true,
    complete: addPoints,
  });

  //  addPoints is a bit simpler, as no GeoJSON is needed for the points
  function addPoints(data) {
    data = data.data;
    // let pointGroupLayer = L.layerGroup().addTo(map);
    let bars = L.layerGroup().addTo(map);
    let merchants = L.layerGroup().addTo(map);
    let gates = L.layerGroup().addTo(map);

    // Choose marker type. Options are:
    // (these are case-sensitive, defaults to marker!)
    // marker: standard point with an icon
    // circleMarker: a circle with a radius set in pixels
    // circle: a circle with a radius set in meters
    let markerType = "marker";

    // Marker radius
    // Wil be in pixels for circleMarker, metres for circle
    // Ignore for point
    let markerRadius = 100;

    for (let row = 0; row < data.length; row++) {
      let marker;
      if (markerType == "circleMarker") {
        marker = L.circleMarker([data[row].y, data[row].x], {
          radius: markerRadius,
        });
      } else if (markerType == "circle") {
        marker = L.circle([data[row].y, data[row].x], {
          radius: markerRadius,
        });
      } else {
        marker = L.marker([data[row].y, data[row].x]);
      }

      // marker.addTo(pointGroupLayer);
      if (data[row].category == "Bar") {
        marker.addTo(bars)
      }
      if (data[row].category == "Merchant") {
        marker.addTo(merchants)
      }
      if (data[row].category == "Gate") {
        marker.addTo(gates)
      }

      // UNCOMMENT THIS SECTION TO USE POPUPS
      // https://leafletjs.com/reference.html#popup-option
      marker.bindPopup(
        L.popup(
          {
            maxWidth: 500,
            closeButton: true,
            autoClose: true
          }).setContent(
            '<h2>' + data[row].name + '</h2>' +
            '<i>' + data[row].description + '</i>' +
            '<br>' +
            '<br>' +
            '<b>Category</b>: ' + data[row].category + '<br>' +
            '<b><a href="https://docs.google.com/document/d/1AIyuBI4_68FiBrRXwBQu0WXtxzud9VpA1_AyKc8Eg78/edit?usp=sharing">Session</a></b>: ' + data[row].session
          )
      )

      // COMMENT THE NEXT GROUP OF LINES TO DISABLE SIDEBAR FOR THE MARKERS
      // marker.feature = {
      //   properties: {
      //     name: data[row].name,
      //     description: data[row].description,
      //     session: data[row].session,
      //     npc: data[row].npc
      //   },
      // };
      // marker.on({
      //   click: function (e) {
      //     L.DomEvent.stopPropagation(e);
      //     document.getElementById("sidebar-title").innerHTML =
      //       e.target.feature.properties.name;
      //     // document.getElementById("sidebar-content").innerHTML =
      //     //   e.target.feature.properties.description;
      //     document.getElementById("sidebar-content").innerHTML =
      //       '<i>' + e.target.feature.properties.description + '</i>' +
      //       '<br>' +
      //       '<br>' +
      //       '<hr>' +
      //       '<br>' +
      //       '<b><a href="https://docs.google.com/document/d/1AIyuBI4_68FiBrRXwBQu0WXtxzud9VpA1_AyKc8Eg78/edit?usp=sharing">Session:</a></b> ' + e.target.feature.properties.session
      //     sidebar.open(panelID);
      //   },
      // });
      // COMMENT UNTIL HERE TO DISABLE SIDEBAR FOR THE MARKERS

      // AwesomeMarkers is used to create fancier icons
      let icon = L.AwesomeMarkers.icon({
        // icon: "info-circle",
        icon: data[row].icon,
        iconColor: "white",
        markerColor: data[row].color,
        prefix: "fa",
        extraClasses: "fa-rotate-0",
      });
      if (!markerType.includes("circle")) {
        marker.setIcon(icon);
      }
    }

    // Add layer control
    var overlayTree = [
      {
        label: '<b>Points of Interest</b>',
        selectAllCheckbox: true,
        children: [
          { label: 'Gates', layer: gates, name: 'Waterdeep Gates' },
          { label: 'Merchants', layer: merchants, name: 'Merchants and Shops' },
          { label: 'Bars', layer: bars, name: 'Bars' },
        ]
      },
    ];

    var ctl = L.control.layers.tree(null, overlayTree,
      {
        collapsed: false,
        collapseAll: 'Collapse all',
        expandAll: 'Expand all',
        labelIsSelector: "base"
      })

    ctl.addTo(map)
  }

  // Allow mouse click to record and print X-Y coordinates to console
  map.on('click', function (e) {
    var coord = e.latlng;
    var Y = coord.lat;
    var X = coord.lng;
    console.log("You clicked the map at:\nY: " + Y + "\nX: " + X);
  });



}



// Extra sites
// https://gis.stackexchange.com/questions/301286/how-to-fit-bounds-after-adding-multiple-markers