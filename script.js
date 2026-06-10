// ============================
// CALIBRATED MAP CONFIGURATION (ZOOM 13.0)
// ============================
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    // Symmetrically calculated center matching your custom KML geometry bounds
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
    mainNode:  [9.217046, 45.476790]  // Main Bottom Vertex (Blue Pulse) 
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

    // Başlangıç animasyon tetikleyicisi
    requestAnimationFrame(animateOrbit);
}

// ============================
// REAL-SCALE ORBIT ANIMATION ENGINE (Genişletilmiş Çap)
// ============================
const EARTH_RADIUS_METERS = 6378137;
const LAT_TO_METERS = (Math.PI * EARTH_RADIUS_METERS) / 180; 

let angle = 0;
// Yörünge genişlediği için hız hissini korumak adına adım değerini hafifçe optimize ettik
const orbitSpeed = 0.004; 

function animateOrbit() {
    angle += orbitSpeed;

    people.forEach(person => {
        if (!person.instance) return;

        const centerLng = positions[person.id][0];
        const centerLat = positions[person.id][1];

        // Genişletilmiş Çap: Hareketin rahatça seçilebilmesi için gerçek dünyada 56.4 metre yarıçap tanımlandı.
        const radiusMeters = 56.4; 

        const lngToMeters = LAT_TO_METERS * Math.cos(centerLat * Math.PI / 180);

        const deltaLat = (radiusMeters * Math.sin(angle)) / LAT_TO_METERS;
        const deltaLng = (radiusMeters * Math.cos(angle)) / lngToMeters;

        person.instance.setLngLat([centerLng + deltaLng, centerLat + deltaLat]);
    });

    requestAnimationFrame(animateOrbit);
}

// Render stationary configuration fields immediately
initMarkers();