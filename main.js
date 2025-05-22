/* Wind & Wetter Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map").setView([ibk.lat, ibk.lng], 5);

// thematische Layer
let overlays = {
    forecast: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map)
}

// Layer Control
let layerControl = L.control.layers({
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery").addTo(map)
}, {
    "Wettervorhersage MET Norway": overlays.forecast,
    "ECMWF Windvorhersage": overlays.wind,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Ort über OpenStrretMap reverse geocoding bestimmen
async function getPlaceName(url) {
    let response = await fetch(url);
    let jsondata = await response.json();
    return jsondata.display_name; 
} 
// MET Norway Vorhersage visualisieren
async function showForecast(latlng) {
    //console.log("Popup erzeugen bei:", latlng);
    let url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latlng.lat}&lon=${latlng.lng}`;
    let osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&zoom=15&format=jsonv2`;
    let placeName = await getPlaceName(osmUrl);

    //console.log(url);
    let response = await fetch(url);
    let jsondata = await response.json();
    // console.log(jsondata);

    //popup erzeugen
    let details = jsondata.properties.timeseries[0].data.instant.details
    let timestamp = new Date(jsondata.properties.meta.updated_at);
    let markup = `
    <h3>Wettervorhersage für ${timestamp.toLocaleString()} </h3>
    <small>Ort: ${placeName}</small>
    <ul> 
        <li>Luftdruck (hPa): ${details.air_pressure_at_sea_level} </li>
        <li>Lufttemperatur (°C): ${details.air_temperature} </li>
        <li>Bewölkerungsgrad (%): ${details.cloud_area_fraction}</li>
        <li>Luftfeuchtigkeit (%): ${details.relative_humidity}</li>
        <li>Windrichtung (°): ${details.wind_from_direction}</li>
        <li>Windgeschwindigkeit (km/h): ${details.wind_speed}</li>

    </ul>
    `;

    //Wettericons für die nächste 24 Stunden in 3 Stunden Schritten
    for(let i=0; i<=24; i+=3) {
        let symbol = jsondata.properties.timeseries[i].data.next_1_hours.summary.symbol_code;
        
        let time = new Date(jsondata.properties.timeseries[i].time);
        markup += `<img src="icons/${symbol}.svg"style="width:32px"title="${time.toLocaleString()}">`;


    }

    // Links zu den JSON Daten
    markup += `
    <p>
        <a href="${url}" target="forecast">Daten downloaden</a>
        <a href="${osmUrl}" target="forecast">OSM Details zum Ort</a>
    </p>
    `;
    L.popup([
        latlng.lat, latlng.lng
    ], {
        content: markup
    }).openOn(overlays.forecast)

}
// auf Karteklick reagieren
map.on("click", function(evt) {
    //console.log(evt.latlng);
    showForecast(evt.latlng);
})

// Klick auf Innsbruck simulieren
map.fire("click", {
    latlng: {
        lat: ibk.lat,
        lng: ibk.lng,

    }

})


//ECMWF Winddaten mit Pfeilen
async function showWindDir() {
    let url = "https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json";
    let response = await fetch(url);
    let jsondata = await response.json();
   // Leaflet Velocity Layer erzeugen
   let velocityLayer = L.velocityLayer({
    displayValues: true, //zeigt unten links live werte an
    displayOptions: {
        velocityType: "Wind",
        displayPosition: "bottomleft",
        emptyString: "Keine Winddaten verfügbar",
    },
    data: jsondata, // daten aus https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json
    minVelocity: 0,
    maxVelocity: 20,
    velocityScale: 0.015,
    lineWidth: 1.5,
    colorScale: [
        "#0000ff", // tiefblau
        "#0055ff", // kräftiges blau
        "#00ccff", // türkis
        "#00ff66", // hellgrün
        "#ffff00", // gelb
        "#ff9900", // orange
        "#ff0000", // rot
        "#990000" // dunkelrot (sehr stark)
    ],
    
    opacity: 0.97
}).addTo(overlays.wind);
} 

//auf Kartenklick reagieren
map.on("click", function (evt) { //latlng über klick holen
    showForecast(evt.latlng) //koordinaten übergeben und funktion ausführen
})
// ECMWF Windlayer laden
showWindDir();

// Klick auf Innsbruck simulieren map fire beziht sich auf map.on klick
map.fire("click", {
    latlng: {
        lat: ibk.lat,
        lng: ibk.lng,
    }

})