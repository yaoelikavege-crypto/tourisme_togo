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

  maxZoom: 19,
  maxNativeZoom: 19,
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

// =====================================
// 4. FICHES DES VILLES ET DES SITES
// =====================================

// Icônes distinctes : une pastille bleue pour les villes, verte pour les sites
const icones = {
  ville: L.divIcon({
    className: "marqueur-ville",
    html: '<span class="pastille pastille-ville"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  }),

  site: L.divIcon({
    className: "marqueur-site",
    html: '<span class="pastille pastille-site"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  }),
};

// Le contenu HTML d'une fiche : photo si elle existe, sinon un bloc de remplacement
function construireFiche(lieu) {
  const photo = lieu.image
    ? `<img class="fiche-photo" src="${lieu.image}" alt="${lieu.nom}">`
    : `<div class="fiche-photo fiche-sans-photo">Photo à venir</div>`;

  const libelleCategorie = lieu.categorie === "ville" ? "Ville" : "Site touristique";

  return `
    <article class="fiche">
      ${photo}
      <div class="fiche-texte">
        <h3 class="fiche-titre">${lieu.nom}</h3>
        <p class="fiche-meta">${libelleCategorie} · Région ${lieu.region}</p>
        <p class="fiche-description">${lieu.description}</p>
      </div>
    </article>
  `;
}

// Chargement des destinations puis création des marqueurs
fetch("data/destinations.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Impossible de charger les destinations");
    }

    return response.json();
  })

  .then((destinations) => {
    // 1. Un groupe de calques pour tous les lieux
    const lieuxLayer = L.layerGroup().addTo(map);

    // 2. Un marqueur par destination
    destinations.forEach((lieu) => {
      const icone = icones[lieu.categorie] || icones.site;

      L.marker([lieu.latitude, lieu.longitude], { icon: icone })
        .addTo(lieuxLayer)
        .bindPopup(construireFiche(lieu), { maxWidth: 280 })
        .bindTooltip(lieu.nom);
    });

    console.log(`${destinations.length} lieu(x) ajouté(s) à la carte.`);
  })

  .catch((error) => {
    console.error("Erreur :", error);
  });
