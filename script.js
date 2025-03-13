const API_KEY = "5b3ce3597851110001cf62482686444c730a43a0aca89871c7b3d41b"; // OpenRouteService API Key
const START_LAT = 46.118554;
const START_LON = 8.286626;
let currentPolyline = 0

const map = L.map('map').setView([START_LAT, START_LON], 13); // Setta la vista iniziale della mappa (partenza dal negozio)

// Aggiungi le tile della mappa (usiamo OpenStreetMap come esempio)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

function calcolaPrezzo() {
    let destinazione = document.getElementById("destination").value;
    let trasporto = document.getElementById("transport").value;

    if (destinazione === "") {
        document.getElementById("output").innerText = "Inserisci una destinazione valida.";
        return;
    }

    ottieniCoordinate(destinazione).then(coords => {
        if (!coords) {
            document.getElementById("output").innerText = "Indirizzo non trovato.";
            return;
        }
        ottieniDistanza(START_LAT, START_LON, coords.lat, coords.lon, trasporto);
    });
}

function ottieniCoordinate(indirizzo) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(indirizzo)}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) return null;
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        })
        .catch(() => null);
}

function ottieniDistanza(lat1, lon1, lat2, lon2, trasporto) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${lon1},${lat1}&end=${lon2},${lat2}`;

    console.log("URL API:", url); // Debug: vedere l'URL della richiesta

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Risposta API:", data); // Debug: stampiamo la risposta per capire il problema
            if (!data.features || data.features[0].length === 0) {
                document.getElementById("output").innerText = "Errore nel calcolo della distanza.";
                return;
            }

            let distanzaKm = data.features[0].properties.summary.distance / 1000; // Converti da metri a km
            calcolaCosto(distanzaKm, trasporto);

            mostraPercorso(data);
            //document.getElementById("output").innerText = data.features[0].properties.geometry.coordinates;



        })
        .catch(error => {
            console.error("Errore nel recupero della distanza:", error);
            document.getElementById("output").innerText = "Errore nel recupero della distanza.";
        });
}


function calcolaCosto(distanza, trasporto) {
    const costoBase = 5; // Base fissa
    const costoKm = 0.50; // Costo per km
    const moltiplicatore = {
        "elettrodomestici": 1.5,
        "piccolo": 1,
        "bancale": 2,
        "due_bancali": 3
    };

    let costoTotale = (costoBase + (distanza * costoKm)) * moltiplicatore[trasporto];
    document.getElementById("output").innerText = `Il costo della consegna è: €${costoTotale.toFixed(2)}`;
}

function mostraPercorso(response) {
    // Se esiste una polilinea precedente, rimuovila
    if (currentPolyline) {
        map.removeLayer(currentPolyline);
    }

    // Ottieni le coordinate del percorso dalla risposta dell'API
    const coordinates = response.features[0].geometry.coordinates;

    // Crea un array di coordinate in formato [lat, lon] per la polilinea
    const latLngs = coordinates.map(coord => [coord[1], coord[0]]); // Converti da [lon, lat] a [lat, lon]

    // Crea una nuova polilinea e aggiungila alla mappa
    currentPolyline = L.polyline(latLngs, { color: 'blue' }).addTo(map);

    // Centra la mappa sul percorso
    map.fitBounds(currentPolyline.getBounds());
}
