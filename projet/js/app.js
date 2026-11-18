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
// 4. VILLES ET SITES
// =====================================

// Icônes distinctes : une pastille bleue pour les villes, verte pour les sites
// Icônes distinctes : bleu pour les villes, puis une couleur par type de site
function pastille(nom) {
  return L.divIcon({
    className: `marqueur-${nom}`,
    html: `<span class="pastille pastille-${nom}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const icones = {
  ville: pastille("ville"),
  site: pastille("site"),
  "site-nature": pastille("site-nature"),
  "site-patrimoine": pastille("site-patrimoine"),
  "site-plage": pastille("site-plage"),
};

// Habillage d'une ville : capitale, chef-lieu ou simple ville
const libellesStatut = {
  capitale: { texte: "Capitale", classe: "etiquette-capitale" },
  "chef-lieu": { texte: "Chef-lieu de région", classe: "etiquette-chef-lieu" },
  ville: { texte: "Ville", classe: "etiquette-ville" },
};

// Habillage d'un site selon son type
const libellesTypeSite = {
  nature: { texte: "Site naturel", classe: "etiquette-nature" },
  patrimoine: { texte: "Patrimoine", classe: "etiquette-patrimoine" },
  plage: { texte: "Plage", classe: "etiquette-plage" },
};

// 2 188 376 -> "2 188 376 hab."
function formaterPopulation(nombre) {
  if (!nombre) {
    return "";
  }

  return `${nombre.toLocaleString("fr-FR")} hab.`;
}

// Le contenu HTML d'une fiche : photo si elle existe, sinon un bloc de remplacement
function construireFiche(lieu) {
  const photo = lieu.image
    ? `<img class="fiche-photo" src="${lieu.image}" alt="${lieu.nom}">`
    : `<div class="fiche-photo fiche-sans-photo">Photo à venir</div>`;

  // Une ville affiche son statut (capitale / chef-lieu / ville), un site son type
  const libelle =
    lieu.categorie === "ville"
      ? libellesStatut[lieu.statut] || libellesStatut.ville
      : libellesTypeSite[lieu.type] || {
          texte: "Site touristique",
          classe: "etiquette-site",
        };

  const etiquette = libelle.texte;
  const classeEtiquette = libelle.classe;

  const population = formaterPopulation(lieu.population);

  return `
    <article class="fiche">
      ${photo}
      <div class="fiche-texte">
        <h3 class="fiche-titre">${lieu.nom}</h3>
        <p class="fiche-meta">
          <span class="etiquette ${classeEtiquette}">${etiquette}</span>
          Région ${lieu.region}
        </p>
        <p class="fiche-description">${lieu.description}</p>
        ${population ? `<p class="fiche-population">${population}</p>` : ""}
      </div>
    </article>
  `;
}

// Chargement d'un fichier JSON avec vérification de la réponse HTTP
function chargerLieux(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Impossible de charger ${url}`);
    }

    return response.json();
  });
}

// Villes et sites sont dans deux fichiers séparés : le socle, puis les détails
Promise.all([chargerLieux("data/villes.json"), chargerLieux("data/sites.json")])

  .then(([villes, sites]) => {
    // 1. Regroupement : les marqueurs proches fusionnent en un seul rond numéroté.
    //    Sans ça, les 13 lieux du Grand Lomé s'empilent les uns sur les autres.
    const lieuxLayer = L.markerClusterGroup({
      showCoverageOnHover: false, // pas de polygone bleu au survol
      maxClusterRadius: 45, // rayon de fusion, en pixels
      spiderfyOnMaxZoom: true, // au zoom max, les marqueurs serrés s'écartent en araignée
      disableClusteringAtZoom: 13, // au-delà, chaque lieu a son propre marqueur
    });

    // 2. Un marqueur par lieu, ville ou site
    const lieux = villes.concat(sites);

    lieux.forEach((lieu) => {
      // Un site utilise son type (nature / patrimoine / plage) pour choisir sa couleur
      const cle =
        lieu.categorie === "site" && lieu.type
          ? `site-${lieu.type}`
          : lieu.categorie;
      const icone = icones[cle] || icones.site;

      L.marker([lieu.latitude, lieu.longitude], { icon: icone })
        .bindPopup(construireFiche(lieu), { maxWidth: 280 })
        .bindTooltip(lieu.nom)
        .addTo(lieuxLayer);
    });

    // 3. Un seul ajout à la carte, une fois les marqueurs créés
    lieuxLayer.addTo(map);

    console.log(
      `${villes.length} ville(s) et ${sites.length} site(s) ajoutés à la carte.`,
    );
  })

  .catch((error) => {
    console.error("Erreur :", error);
  });
