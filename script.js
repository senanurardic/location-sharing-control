// ============================
// CALIBRATED MAP CONFIGURATION (ZOOM 13.0)
// ============================
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [9.2123, 45.4824], 
    zoom: 13.0,                
    minZoom: 13.0,             
    maxZoom: 13.0,             
    
    // EXPERIMENTAL CONTROLS: FIXED VIEWPORT MATRIX
    dragPan: false,            
    doubleClickZoom: false,    
    boxZoom: false,            
    keyboard: false,           
    touchZoomRotate: false,    
    
    pixelRatio: window.devicePixelRatio || 2 
});

// ============================
// GREEN-GREY MAP DESATURATION FILTER
// ============================
map.on('style.load', () => {
    const mapCanvas = map.getCanvas();
    mapCanvas.style.filter = 'grayscale(0.6) contrast(1.1) brightness(0.95) hue-rotate(25deg)';
});

// ============================
// EXACT EXTRACTED KML COORDINATE NODES
// ============================
const positions = {
    leftNode:  [9.203801, 45.483950], // Top-Left Vertex ("G") 
    rightNode: [9.216763, 45.486383], // Top-Right Vertex ("M") 
    mainNode:  [9.217046, 45.476790]  // Main Bottom Vertex (Blue Pulse - TAMAMEN SABİT) 
};

// ============================
// EXPERIMENT SUBJECTS CONFIGURATION
// ============================
const people = [
    {
        id: "leftNode",
        markerType: "grey-letter-dot",
        initial: "G",
        instance: null
    },
    {
        id: "rightNode",
        markerType: "grey-letter-dot",
        initial: "M",
        instance: null
    },
    {
        id: "mainNode",
        markerType: "blue-pulse-dot",
        instance: null
    }
];

// ============================
// MARKER RENDER ENGINE
// ============================
function createMarkerElement(person) {
    const clusterEl = document.createElement("div");
    clusterEl.className = "marker-cluster";

    const agentEl = document.createElement("div");
    agentEl.className = "agent-node";

    if (person.markerType === "blue-pulse-dot") {
        const mapsDotContainer = document.createElement("div");
        mapsDotContainer.className = "google-maps-dot-container";

        const breathingPulse = document.createElement("div");
        breathingPulse.className = "google-maps-pulse";

        const solidCore = document.createElement("div");
        solidCore.className = "google-maps-core";

        mapsDotContainer.appendChild(breathingPulse);
        mapsDotContainer.appendChild(solidCore);
        agentEl.appendChild(mapsDotContainer);
    } 
    else if (person.markerType === "grey-letter-dot") {
        const greyDot = document.createElement("div");
        greyDot.className = "experimental-grey-letter-dot";
        greyDot.textContent = person.initial;
        agentEl.appendChild(greyDot);
    }

    clusterEl.appendChild(agentEl);
    return clusterEl;
}

function initMarkers() {
    people.forEach(person => {
        person.instance = new maplibregl.Marker({
            element: createMarkerElement(person),
            anchor: "center"
        })
        .setLngLat(positions[person.id])
        .addTo(map);
    });
}

// ============================
// TIMED REAL-SCALE ORBIT ANIMATION
// ============================
const EARTH_RADIUS_METERS = 6378137;
const LAT_TO_METERS = (Math.PI * EARTH_RADIUS_METERS) / 180; 
const radiusMeters = 50.0; 
const orbitSpeed = 0.004; 

let startTime = null;
const TOTAL_END_TIME = 130; // 10s sabit bekleme + 120s dairesel hareket = 130s total bitiş

function animateOrbit(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsedSeconds = (timestamp - startTime) / 1000;

    // 1. Durum: İlk 10 saniye tüm aktörler başlangıç konumunda milimetrik sabit bekler
    if (elapsedSeconds < 10) {
        people.forEach(person => {
            if (person.instance) person.instance.setLngLat(positions[person.id]);
        });
    }
    // 2. Durum: 10 ile 130. saniyeler arası sadece G ve M pürüzsüzce dairesel yörüngeye girer
    else if (elapsedSeconds >= 10 && elapsedSeconds <= TOTAL_END_TIME) {
        const activeSeconds = elapsedSeconds - 10;
        const currentAngle = (activeSeconds * 60 * orbitSpeed); 

        people.forEach(person => {
            if (!person.instance) return;

            // Mavi nokta bu döngüde tamamen orijinal koordinatına kilitlenir
            if (person.id === "mainNode") {
                person.instance.setLngLat(positions.mainNode);
                return;
            }

            const centerLng = positions[person.id][0];
            const centerLat = positions[person.id][1];
            const lngToMeters = LAT_TO_METERS * Math.cos(centerLat * Math.PI / 180);

            // Sin(0)=0 ve Cos(0)-1 düzeltmesi ile hareket tam durduğu yerden pürüzsüz başlar
            const deltaLat = (radiusMeters * Math.sin(currentAngle)) / LAT_TO_METERS;
            const deltaLng = (radiusMeters * (Math.cos(currentAngle) - 1)) / lngToMeters;

            person.instance.setLngLat([centerLng + deltaLng, centerLat + deltaLat]);
        });
    }
    // 3. Durum: 130. saniyede en son konumlarında donarlar ve işlem biter
    else if (elapsedSeconds > TOTAL_END_TIME) {
        const finalActiveSeconds = TOTAL_END_TIME - 10;
        const finalAngle = (finalActiveSeconds * 60 * orbitSpeed);

        people.forEach(person => {
            if (!person.instance) return;

            if (person.id === "mainNode") {
                person.instance.setLngLat(positions.mainNode);
                return;
            }

            const centerLng = positions[person.id][0];
            const centerLat = positions[person.id][1];
            const lngToMeters = LAT_TO_METERS * Math.cos(centerLat * Math.PI / 180);

            const deltaLat = (radiusMeters * Math.sin(finalAngle)) / LAT_TO_METERS;
            const deltaLng = (radiusMeters * (Math.cos(finalAngle) - 1)) / lngToMeters;

            person.instance.setLngLat([centerLng + deltaLng, centerLat + deltaLat]);
        });
        return; 
    }

    requestAnimationFrame(animateOrbit);
}

// ============================
// ASYNC LOAD GUARD (ÇİFT KONTROL MEKANİZMASI)
// ============================
function runEngine() {
    initMarkers();
    requestAnimationFrame(animateOrbit);
}

// Harita henüz yüklenmediyse olayı bekle, çoktan yüklendiyse doğrudan çalıştır
if (map.loaded()) {
    runEngine();
} else {
    map.on('load', runEngine);
}