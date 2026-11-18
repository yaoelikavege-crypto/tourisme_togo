// =====================================
// POINT D'ENTRÉE — ROUTEUR
// =====================================

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { chargerDonnees, etatChargement, etatErreur } from "./store.js";
import { rendrePied } from "./composants/pied.js";

import pageAccueil from "./pages/accueil.js";
import pageExplorer from "./pages/explorer.js";
import pageRegions from "./pages/regions.js";
import pageDestinations from "./pages/destinations.js";
import pageDetail from "./pages/detail.js";
import pageCircuits from "./pages/circuits.js";
import pageCulture from "./pages/culture.js";
import pageAPropos from "./pages/a-propos.js";

const conteneur = document.querySelector("#contenu");
const nav = document.querySelector("#nav");
const burger = document.querySelector("#nav-burger");

// =====================================
// DÉFINITION DES ROUTES
// =====================================
// Chaque route reçoit les données chargées et le fragment d'URL.
// `nettoyer` est appelée avant de quitter la page (utile pour Leaflet).

const routes = [
  { motif: /^\/?$/, page: pageAccueil, nav: "accueil", titre: null },
  { motif: /^\/explorer\/?$/, page: pageExplorer, nav: "explorer", titre: "Explorer le Togo" },
  { motif: /^\/regions\/?$/, page: pageRegions, nav: "regions", titre: "Les régions" },
  { motif: /^\/region\/([^/]+)\/?$/, page: pageRegions, nav: "regions", parametre: true },
  { motif: /^\/destinations\/?$/, page: pageDestinations, nav: "destinations", titre: "Destinations" },
  { motif: /^\/destination\/([^/]+)\/(\d+)\/?$/, page: pageDetail, nav: "destinations", parametre: true },
  { motif: /^\/circuits\/?$/, page: pageCircuits, nav: "circuits", titre: "Circuits" },
  { motif: /^\/culture\/?$/, page: pageCulture, nav: "culture", titre: "Culture & Patrimoine" },
  { motif: /^\/a-propos\/?$/, page: pageAPropos, nav: "a-propos", titre: "À propos" },
];

let nettoyageCourant = null;

// =====================================
// NAVIGATION
// =====================================

function fermerMenu() {
  nav.classList.remove("ouvert");
  burger.setAttribute("aria-expanded", "false");
}

function marquerNav(cle) {
  nav.querySelectorAll("a").forEach((lien) => {
    lien.classList.toggle("actif", lien.dataset.route === cle);
  });
}

burger.addEventListener("click", () => {
  const ouvert = nav.classList.toggle("ouvert");
  burger.setAttribute("aria-expanded", String(ouvert));
});

nav.addEventListener("click", (evenement) => {
  if (evenement.target.closest("a")) fermerMenu();
});

// =====================================
// RENDU
// =====================================

async function rendre() {
  // 1. Nettoyage de la page précédente (carte Leaflet, écouteurs…)
  if (typeof nettoyageCourant === "function") {
    nettoyageCourant();
    nettoyageCourant = null;
  }

  const chemin = location.hash.replace(/^#/, "") || "/";

  const route = routes.find((r) => r.motif.test(chemin));

  if (!route) {
    document.title = "Page introuvable — Tourisme Togo";
    conteneur.innerHTML = `
      <section class="section">
        <div class="conteneur">
          <span class="surtitre">Erreur 404</span>
          <h1>Cette page n'existe pas</h1>
          <p>Le lien demandé est introuvable. Revenez à l'accueil pour poursuivre la découverte.</p>
          <a class="btn btn--principal" href="#/">Retour à l'accueil</a>
        </div>
      </section>`;
    marquerNav("");
    return;
  }

  marquerNav(route.nav);
  document.title = route.titre
    ? `${route.titre} — Tourisme Togo`
    : "Tourisme Togo — Le Togo, une terre de découvertes (accueil)";
  if (!route.titre) {
    document.title = "Tourisme Togo — Le Togo, une terre de découvertes";
  }

  // 2. État de chargement le temps d'aller chercher les données
  conteneur.innerHTML = etatChargement();

  try {
    const donnees = await chargerDonnees();
    const correspondance = chemin.match(route.motif);
    // Pour /destination/site/11, on transmet "site/11" à la page
    const parametre = correspondance
      ? correspondance.slice(1).filter(Boolean).map(decodeURIComponent).join("/")
      : "";

    conteneur.innerHTML = "";

    nettoyageCourant = await route.page({
      conteneur,
      donnees,
      parametre,
      chemin,
    });

    // 3. On remonte en haut à chaque changement de page
    window.scrollTo({ top: 0, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
  } catch (erreur) {
    console.error("Erreur de rendu :", erreur);
    conteneur.innerHTML = etatErreur(
      "Les données touristiques n'ont pas pu être chargées.",
      erreur.message,
    );
  }
}

// =====================================
// DÉMARRAGE
// =====================================

rendrePied(document.querySelector("#pied"));

window.addEventListener("hashchange", rendre);
window.addEventListener("DOMContentLoaded", rendre);

if (document.readyState !== "loading") {
  rendre();
}
