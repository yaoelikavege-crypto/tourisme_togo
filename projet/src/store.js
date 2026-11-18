// =====================================
// ACCÈS AUX DONNÉES
// =====================================
// Les fichiers data/*.json restent la source de vérité, partagée avec les
// autres contributeurs. On ne les modifie jamais ici : on les lit.

const CHEMINS = {
  villes: "data/villes.json",
  sites: "data/sites.json",
};

export const REGIONS = ["Savanes", "Kara", "Centrale", "Plateaux", "Maritime"];

export const REGION_INFO = {
  Maritime: {
    chefLieu: "Lomé",
    resume:
      "Façade atlantique du pays, lagunes, plages et capitale économique. La région la plus dense et la plus urbanisée du Togo.",
  },
  Plateaux: {
    chefLieu: "Atakpamé",
    resume:
      "Collines, forêts et plantations de café-cacao. Le pays kpaliméen des cascades et du mont Agou, point culminant du pays.",
  },
  Centrale: {
    chefLieu: "Sokodé",
    resume:
      "Cœur du pays tem, savanes boisées et reliefs. Point de passage entre le sud forestier et le nord soudanien.",
  },
  Kara: {
    chefLieu: "Kara",
    resume:
      "Pays kabyè et lamba, montagnes, vallées et le Koutammakou des Batammariba, inscrit au patrimoine mondial.",
  },
  Savanes: {
    chefLieu: "Dapaong",
    resume:
      "Extrême nord, savane soudanienne, grottes et parcs. Les frontières du Burkina Faso et du Bénin s'y rejoignent.",
  },
};

export const TYPES = {
  nature: { libelle: "Site naturel", classe: "type--nature" },
  patrimoine: { libelle: "Patrimoine", classe: "type--patrimoine" },
  plage: { libelle: "Plage", classe: "type--plage" },
  site_historique: { libelle: "Site historique", classe: "type--historique" },
};

export const STATUTS = {
  capitale: "Capitale",
  "chef-lieu": "Chef-lieu de région",
  ville: "Ville",
};

// Visuel de remplacement : dégradé sobre + initiale, plutôt qu'une image cassée
const COULEURS_FALLBACK = {
  nature: ["#14532D", "#166534"],
  patrimoine: ["#8A5A2B", "#B4773C"],
  plage: ["#166a8f", "#2b8fb5"],
  site_historique: ["#3F4A56", "#5b6773"],
  ville: ["#14532D", "#2b7a4b"],
};

// =====================================
// CHARGEMENT
// =====================================

let cache = null;
let promesse = null;

async function chargerJson(url) {
  const reponse = await fetch(url);

  if (!reponse.ok) {
    throw new Error(
      `Impossible de charger ${url} (erreur ${reponse.status}). Vérifiez que le fichier existe.`,
    );
  }

  return reponse.json();
}

// Charge une seule fois les deux fichiers et enrichit les lieux
export async function chargerDonnees() {
  if (cache) return cache;
  if (promesse) return promesse;

  promesse = (async () => {
    const [villes, sites] = await Promise.all([
      chargerJson(CHEMINS.villes),
      chargerJson(CHEMINS.sites),
    ]);

    const enrichir = (lieu) => ({
      ...lieu,
      type: lieu.type || null,
      estVille: lieu.categorie === "ville",
    });

    const lieux = [...villes.map(enrichir), ...sites.map(enrichir)];

    cache = { villes, sites, lieux };
    return cache;
  })();

  try {
    const donnees = await promesse;
    return donnees;
  } catch (erreur) {
    promesse = null;
    throw erreur;
  }
}

// =====================================
// HELPERS D'AFFICHAGE
// =====================================

// "Koutammakou" -> "koutammakou" ; retire les accents pour la recherche
export function normaliser(texte) {
  return (texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function trierParNom(liste) {
  return [...liste].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export function libelleType(lieu) {
  if (lieu.categorie === "ville") {
    return STATUTS[lieu.statut] || "Ville";
  }

  return (TYPES[lieu.type] && TYPES[lieu.type].libelle) || "Site touristique";
}

export function classeType(lieu) {
  if (lieu.categorie === "ville") return "type--ville";

  return (TYPES[lieu.type] && TYPES[lieu.type].classe) || "type--nature";
}

export function formaterPopulation(nombre) {
  if (!nombre) return "";
  return `${nombre.toLocaleString("fr-FR")} hab.`;
}

export function formaterCoordonnees(lieu) {
  return `${Number(lieu.latitude).toFixed(4)}, ${Number(lieu.longitude).toFixed(4)}`;
}

// Lien d'itinéraire : ouvre Google Maps avec les coordonnées réelles
export function lienItineraire(lieu) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lieu.latitude},${lieu.longitude}`;
}

// Chemin d'image commun aux deux fichiers
export function cheminImage(lieu) {
  if (!lieu.image) return null;

  // Les JSON utilisent des chemins déjà valides : on garde la casse et les accents
  return lieu.image;
}

// Distance à vol d'oiseau en km (formule de haversine)
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

// Destinations les plus proches d'un lieu
export function lieuxProches(lieu, liste, nombre = 4) {
  return liste
    .filter((x) => x.id !== lieu.id || x.categorie !== lieu.categorie)
    .map((x) => ({ lieu: x, distance: distanceKm(lieu, x) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, nombre);
}

// =====================================
// COMPOSANT : VISUEL (image ou repli)
// =====================================

// Retourne le HTML d'une image avec repli automatique sur un dégradé.
// `ratio` : "paysage" | "portrait" | "carre" | "large"
export function visuel(lieu, ratio = "paysage") {
  const image = cheminImage(lieu);
  const cle = lieu.categorie === "ville" ? "ville" : lieu.type || "nature";
  const [c1, c2] = COULEURS_FALLBACK[cle] || COULEURS_FALLBACK.nature;
  const initiale = (lieu.nom || "?").trim().charAt(0).toUpperCase();

  const fond = `
    <div class="visuel-repli" style="background: linear-gradient(135deg, ${c1}, ${c2})">
      <span aria-hidden="true">${initiale}</span>
    </div>`;

  if (!image) {
    return `<div class="visuel visuel--${ratio}" aria-hidden="true">${fond}</div>`;
  }

  return `
    <div class="visuel visuel--${ratio}">
      <img
        src="${image}"
        alt="${echapper(lieu.nom)}"
        loading="lazy"
        decoding="async"
        onerror="this.closest('.visuel').classList.add('visuel--casse'); this.closest('.visuel').innerHTML = this.closest('.visuel').dataset.repli;"
        data-repli='${fond.replace(/'/g, "&#39;")}'
      >
    </div>`;
}

// =====================================
// SÉCURITÉ : échappement HTML
// =====================================

export function echapper(texte) {
  return String(texte || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =====================================
// ÉTATS D'INTERFACE
// =====================================

export function etatChargement(message = "Chargement des destinations…") {
  return `
    <div class="etat" role="status">
      <div class="etat-spinner" aria-hidden="true"></div>
      <p>${message}</p>
    </div>`;
}

export function etatErreur(message, details = "") {
  return `
    <div class="etat etat--erreur" role="alert">
      <h2>Impossible d'afficher les données</h2>
      <p>${echapper(message)}</p>
      ${details ? `<p class="etat-details">${echapper(details)}</p>` : ""}
      <button type="button" class="btn btn--principal" onclick="location.reload()">
        Réessayer
      </button>
    </div>`;
}

export function etatVide(message) {
  return `
    <div class="etat etat--vide">
      <p>${echapper(message)}</p>
    </div>`;
}
