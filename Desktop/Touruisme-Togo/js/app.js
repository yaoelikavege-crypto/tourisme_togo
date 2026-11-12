// =====================================
// 1. INITIALISATION DE LA CARTE
// =====================================

const map = L.map("map").setView([8.6, 0.8], 9);

// =====================================
// 2. AJOUT DU FOND CARTOGRAPHIQUE
// =====================================

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  maxZoom: 60,
}).addTo(map);

// =====================================
// 3. CHARGEMENT DES FRONTIÈRES DU TOGO
// =====================================

// Palette touristique des régions du Togo
const couleursRegions = {
  "TG-S": "#D99A22", // Savanes : ocre doré
  "TG-K": "#C44936", // Kara : rouge latérite
  "TG-C": "#8A9B32", // Centrale : vert olive
  "TG-P": "#176B45", // Plateaux : vert forêt
  "TG-M": "#168AAD", // Maritime : bleu océan
};

// Chargement coordonné des fichiers GeoJSON
Promise.all([fetch("data/togo.geojson"), fetch("data/togo_regions.geojson")])

  .then(async ([responseTogo, responseRegions]) => {
    // Vérification des réponses HTTP
    if (!responseTogo.ok) {
      throw new Error("Impossible de charger les frontières du Togo");
    }

    if (!responseRegions.ok) {
      throw new Error("Impossible de charger les régions");
    }

    // Conversion des réponses en JSON
    const [togoData, regionsData] = await Promise.all([
      responseTogo.json(),
      responseRegions.json(),
    ]);

    // 1. Couche des régions
    const regionsLayer = L.geoJSON(regionsData, {
      style: function (feature) {
        const code = feature.properties.shapeISO;

        return {
          color: "#FFFFFF",
          weight: 1.5,
          opacity: 0.9,

          fillColor: couleursRegions[code] || "#64748B",
          fillOpacity: 0.1,

          lineJoin: "round",
        };
      },

      onEachFeature: function (feature, layer) {
        const nom = feature.properties.shapeName;

        layer.bindPopup(`<strong>${nom}</strong>`);
        layer.bindTooltip(nom);
      },
    }).addTo(map);

    // 2. Couche des frontières nationales
    const togoLayer = L.geoJSON(togoData, {
      style: {
        color: "#263746",
        weight: 3,
        opacity: 1,

        fill: false,

        lineJoin: "round",
      },
    }).addTo(map);

    // 3. Garantir que le contour national reste au-dessus
    togoLayer.bringToFront();

    // 4. Adapter le zoom aux frontières nationales
    map.fitBounds(togoLayer.getBounds(), {
      padding: [15, 15],
    });

    console.log("Carte touristique du Togo chargée !");
    console.log("Régions et frontières nationales affichées.");
  })

  .catch((error) => {
    console.error("Erreur de chargement :", error);
  });

fetch("data/destinations.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Impossible de charger les destinations");
    }

    return response.json();
  })

  .then((destinations) => {
    console.log(destinations);

    // 1. Création d'un groupe de calques pour les villes
    const villeLayer = L.layerGroup().addTo(map);

    // 2. Boucle sur les destinations pour créer des marqueurs
    destinations.forEach((ville) => {
      if (ville.categorie === "ville") {
        L.marker([ville.latitude, ville.longitude]).addTo(villeLayer)
          .bindPopup(`
            <h3>${ville.nom}</h3>
            <p>${ville.description}</p>
            <p>Region: ${ville.region}</p>
            `);
      }
    });
  })

  .catch((error) => {
    console.error("Erreur :", error);
  });
