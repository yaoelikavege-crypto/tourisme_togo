// =====================================
// PAGE 2 — EXPLORER LE TOGO (carte + résultats)
// =====================================

import L from "leaflet";
import "leaflet.markercluster";

import {
  REGIONS,
  TYPES,
  echapper,
  normaliser,
  trierParNom,
  libelleType,
  classeType,
  visuel,
  formaterCoordonnees,
  lienItineraire,
} from "../store.js";

const COULEURS_REGIONS = {
  "TG-S": "#D9A441",
  "TG-K": "#B4674A",
  "TG-C": "#8A9B32",
  "TG-P": "#166534",
  "TG-M": "#166A8F",
};

// Icône : forme distincte par type (lisible même sans couleur)
const FORMES = {
  nature: { forme: "ronde", couleur: "#166534" },
  patrimoine: { forme: "losange", couleur: "#B4674A" },
  plage: { forme: "goutte", couleur: "#166A8F" },
  site_historique: { forme: "carre", couleur: "#3F4A56" },
  ville: { forme: "ronde", couleur: "#14532D" },
};

function iconePour(lieu) {
  const cle = lieu.categorie === "ville" ? "ville" : lieu.type || "nature";
  const config = FORMES[cle] || FORMES.nature;
  const taille = lieu.categorie === "ville" ? 16 : 18;

  return L.divIcon({
    className: `marqueur marqueur--${config.forme}`,
    html: `<span class="marqueur-point" style="background:${config.couleur}"></span>`,
    iconSize: [taille, taille],
    iconAnchor: [taille / 2, taille / 2],
    popupAnchor: [0, -taille / 2],
  });
}

// Fiche affichée dans la popup Leaflet
function contenuPopup(lieu) {
  return `
    <div class="popup-carte">
      ${visuel(lieu, "paysage")}
      <div class="popup-corps">
        <span class="etiquette ${classeType(lieu)}">${libelleType(lieu)}</span>
        <h3>${echapper(lieu.nom)}</h3>
        <p class="popup-region">Région ${echapper(lieu.region)}</p>
        <p class="popup-texte">${echapper(lieu.description)}</p>
        <code class="popup-gps">${formaterCoordonnees(lieu)}</code>
        <a class="btn btn--principal btn--petit" href="#/destination/${lieu.categorie}/${lieu.id}">
          Voir la destination
        </a>
      </div>
    </div>`;
}

export default async function pageExplorer({ conteneur, donnees, chemin }) {
  const { lieux } = donnees;

  // Paramètre éventuel : #/explorer?q=cascade
  const parametres = new URLSearchParams(chemin.split("?")[1] || "");

  const etat = {
    recherche: parametres.get("q") || "",
    region: "",
    categorie: "",
  };

  conteneur.innerHTML = `
    <div class="explorer">
      <aside class="explorer-panneau" id="panneau">
        <div class="explorer-filtres">
          <div class="explorer-champ">
            <label for="f-recherche">Rechercher</label>
            <input
              id="f-recherche"
              type="search"
              placeholder="Nom d'un lieu ou d'une région…"
              value="${echapper(etat.recherche)}"
              autocomplete="off"
            >
          </div>

          <div class="explorer-champ">
            <label for="f-region">Région</label>
            <select id="f-region">
              <option value="">Toutes les régions</option>
              ${REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("")}
            </select>
          </div>

          <div class="explorer-champ">
            <label for="f-categorie">Catégorie</label>
            <select id="f-categorie">
              <option value="">Villes et sites</option>
              <option value="ville">Villes uniquement</option>
              <option value="site">Sites uniquement</option>
            </select>
          </div>

          <div class="explorer-champ">
            <label for="f-type">Type de site</label>
            <select id="f-type">
              <option value="">Tous les types</option>
              ${Object.entries(TYPES)
                .map(([cle, t]) => `<option value="${cle}">${t.libelle}</option>`)
                .join("")}
            </select>
          </div>

          <button class="btn btn--secondaire btn--petit" id="f-reset" type="button">
            Réinitialiser les filtres
          </button>
        </div>

        <div class="explorer-resultats">
          <div class="explorer-compte" id="compte" role="status"></div>
          <ul class="explorer-liste" id="liste"></ul>
        </div>
      </aside>

      <button class="explorer-bascule" id="bascule" type="button" aria-expanded="false">
        ☰ Recherche et résultats
      </button>

      <div class="explorer-carte" id="carte"></div>
    </div>
  `;

  // ---- CARTE
  const map = L.map("carte", {
    center: [8.6, 0.9],
    zoom: 7,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    maxNativeZoom: 19,
  }).addTo(map);

  // ---- CONTOURS (chargés en parallèle, sans bloquer l'affichage des marqueurs)
  let coucheContours = null;

  Promise.all([
    fetch("data/togo.geojson").then((r) => (r.ok ? r.json() : null)),
    fetch("data/togo_regions.geojson").then((r) => (r.ok ? r.json() : null)),
  ])
    .then(([togo, regions]) => {
      if (!map) return;

      if (regions) {
        L.geoJSON(regions, {
          style: (feature) => ({
            color: "#FFFFFF",
            weight: 1.2,
            opacity: 0.85,
            fillColor:
              COULEURS_REGIONS[feature.properties.shapeISO] || "#64748B",
            fillOpacity: 0.08,
            lineJoin: "round",
          }),
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(feature.properties.shapeName, { sticky: true });
          },
        }).addTo(map);
      }

      if (togo) {
        coucheContours = L.geoJSON(togo, {
          style: { color: "#1F2937", weight: 2.4, fill: false, opacity: 0.9 },
        }).addTo(map);

        map.fitBounds(coucheContours.getBounds(), { padding: [18, 18] });
      }
    })
    .catch(() => {
      /* les contours sont un bonus : la carte reste utilisable sans eux */
    });

  // ---- MARQUEURS
  const groupe = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 13,
  });

  const marqueurs = new Map(); // "ville-3" -> marqueur

  lieux.forEach((lieu) => {
    const marqueur = L.marker([lieu.latitude, lieu.longitude], {
      icon: iconePour(lieu),
      title: lieu.nom,
      alt: `${lieu.nom}, ${libelleType(lieu)}, région ${lieu.region}`,
    })
      .bindPopup(contenuPopup(lieu), { maxWidth: 300, minWidth: 260 })
      .bindTooltip(lieu.nom);

    lieu.marqueur = marqueur;
    marqueurs.set(`${lieu.categorie}-${lieu.id}`, marqueur);
    groupe.addLayer(marqueur);
  });

  groupe.addTo(map);

  // ---- FILTRAGE
  const champ = conteneur.querySelector("#f-recherche");
  const champRegion = conteneur.querySelector("#f-region");
  const champCategorie = conteneur.querySelector("#f-categorie");
  const champType = conteneur.querySelector("#f-type");
  const boutonReset = conteneur.querySelector("#f-reset");
  const compte = conteneur.querySelector("#compte");
  const liste = conteneur.querySelector("#liste");

  function correspond(lieu) {
    const requete = normaliser(etat.recherche);

    if (requete) {
      const champs = [normaliser(lieu.nom), normaliser(lieu.region), normaliser(lieu.type || "")];
      if (!champs.some((v) => v.includes(requete))) return false;
    }

    if (etat.region && lieu.region !== etat.region) return false;
    if (etat.categorie && lieu.categorie !== etat.categorie) return false;
    if (etat.typeSelect && lieu.type !== etat.typeSelect) return false;

    return true;
  }

  function appliquer() {
    const visibles = trierParNom(lieux.filter(correspond));
    const clesVisibles = new Set(visibles.map((l) => `${l.categorie}-${l.id}`));

    // 1. Mise à jour de la carte
    marqueurs.forEach((marqueur, cle) => {
      const present = groupe.hasLayer(marqueur);
      if (clesVisibles.has(cle) && !present) groupe.addLayer(marqueur);
      if (!clesVisibles.has(cle) && present) groupe.removeLayer(marqueur);
    });

    // 2. Compteur
    compte.textContent = `${visibles.length} résultat${visibles.length > 1 ? "s" : ""} sur ${lieux.length}`;

    // 3. Liste
    if (!visibles.length) {
      liste.innerHTML = `<li class="explorer-vide">Aucun lieu ne correspond à ces critères.</li>`;
      return;
    }

    liste.innerHTML = visibles
      .map(
        (lieu) => `
        <li>
          <button type="button" class="explorer-item" data-cle="${lieu.categorie}-${lieu.id}">
            <span class="explorer-item-nom">${echapper(lieu.nom)}</span>
            <span class="explorer-item-meta">
              <span class="etiquette ${classeType(lieu)}">${libelleType(lieu)}</span>
              ${echapper(lieu.region)}
            </span>
          </button>
        </li>`,
      )
      .join("");
  }

  // Clic sur un résultat : la carte vole sur le lieu et ouvre sa fiche
  liste.addEventListener("click", (evenement) => {
    const bouton = evenement.target.closest(".explorer-item");
    if (!bouton) return;

    const marqueur = marqueurs.get(bouton.dataset.cle);
    if (!marqueur) return;

    groupe.zoomToShowLayer(marqueur, () => marqueur.openPopup());
    fermerPanneauMobile();
  });

  // Écouteurs de filtres
  let minuterie = null;
  champ.addEventListener("input", () => {
    etat.recherche = champ.value;
    clearTimeout(minuterie);
    minuterie = setTimeout(appliquer, 160);
  });

  champRegion.addEventListener("change", () => {
    etat.region = champRegion.value;
    appliquer();
  });

  champCategorie.addEventListener("change", () => {
    etat.categorie = champCategorie.value;
    appliquer();
  });

  champType.addEventListener("change", () => {
    etat.typeSelect = champType.value;
    appliquer();
  });

  boutonReset.addEventListener("click", () => {
    etat.recherche = "";
    etat.region = "";
    etat.categorie = "";
    etat.typeSelect = "";
    champ.value = "";
    champRegion.value = "";
    champCategorie.value = "";
    champType.value = "";
    appliquer();
    map.fitBounds(coucheContours ? coucheContours.getBounds() : L.latLngBounds([6.1, 0.0], [11.1, 1.8]), {
      padding: [18, 18],
    });
  });

  // Bascule du panneau sur mobile
  const bascule = conteneur.querySelector("#bascule");
  const panneau = conteneur.querySelector("#panneau");

  function fermerPanneauMobile() {
    panneau.classList.remove("ouvert");
    bascule.setAttribute("aria-expanded", "false");
  }

  bascule.addEventListener("click", () => {
    const ouvert = panneau.classList.toggle("ouvert");
    bascule.setAttribute("aria-expanded", String(ouvert));
  });

  appliquer();

  // La carte doit recalculer sa taille après le rendu de la mise en page
  setTimeout(() => map.invalidateSize(), 60);

  // ---- NETTOYAGE au changement de page : indispensable pour Leaflet
  return () => {
    clearTimeout(minuterie);
    map.remove();
  };
}
