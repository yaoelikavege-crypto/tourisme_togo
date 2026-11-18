// =====================================
// COMPOSANTS PARTAGÉS
// =====================================

import { echapper, classeType, libelleType, visuel } from "../store.js";

// Carte de destination réutilisable
export function carteDestination(lieu, options = {}) {
  const { ratio = "paysage", description = true } = options;

  return `
    <article class="carte-destination">
      <a href="#/destination/${lieu.categorie}/${lieu.id}" aria-label="Découvrir ${echapper(lieu.nom)}">
        ${visuel(lieu, ratio)}
      </a>
      <div class="carte-corps">
        <div class="carte-meta">
          <span class="etiquette ${classeType(lieu)}">${libelleType(lieu)}</span>
          <span>Région ${echapper(lieu.region)}</span>
        </div>
        <h3 class="carte-titre">
          <a href="#/destination/${lieu.categorie}/${lieu.id}">${echapper(lieu.nom)}</a>
        </h3>
        ${
          description
            ? `<p class="carte-description">${echapper(lieu.description)}</p>`
            : ""
        }
        <a class="carte-lien" href="#/destination/${lieu.categorie}/${lieu.id}">
          Voir la destination →
        </a>
      </div>
    </article>`;
}

export function grilleDestinations(lieux, options = {}) {
  const { editoriale = false, ratio = "paysage", description = true } = options;

  if (!lieux.length) {
    return `<p class="etat etat--vide">Aucune destination à afficher.</p>`;
  }

  return `
    <div class="${editoriale ? "grille-editoriale" : "grille-destinations"}">
      ${lieux.map((lieu) => carteDestination(lieu, { ratio, description })).join("")}
    </div>`;
}

// En-tête de section
export function enteteSection({ surtitre, titre, texte, action = "" }) {
  return `
    <div class="entete-section">
      <div>
        ${surtitre ? `<span class="surtitre">${echapper(surtitre)}</span>` : ""}
        <h2>${echapper(titre)}</h2>
        ${texte ? `<p>${echapper(texte)}</p>` : ""}
      </div>
      ${action}
    </div>`;
}

// Pied de page
export function rendrePied(conteneur) {
  conteneur.innerHTML = `
    <div class="pied-inner">
      <div class="pied-colonne">
        <p class="pied-logo"><strong>TOURISME</strong> TOGO</p>
        <p class="pied-texte">
          Plateforme de découverte et de valorisation du patrimoine touristique togolais.
          « Le Togo, une terre de découvertes. »
        </p>
      </div>

      <div class="pied-colonne">
        <h3>Explorer</h3>
        <ul>
          <li><a href="#/explorer">Carte interactive</a></li>
          <li><a href="#/destinations">Toutes les destinations</a></li>
          <li><a href="#/regions">Les cinq régions</a></li>
          <li><a href="#/circuits">Circuits</a></li>
        </ul>
      </div>

      <div class="pied-colonne">
        <h3>Découvrir</h3>
        <ul>
          <li><a href="#/culture">Culture &amp; patrimoine</a></li>
          <li><a href="#/a-propos">À propos du projet</a></li>
          <li><a href="#/a-propos">Nous contacter</a></li>
        </ul>
      </div>

      <div class="pied-colonne">
        <h3>Sources</h3>
        <ul>
          <li>Fond de carte © OpenStreetMap</li>
          <li>Contours : geo-countries (ODC-PDDL)</li>
          <li>Photographies : contributeurs du projet</li>
        </ul>
      </div>
    </div>

    <div class="pied-bas">
      <span>© ${new Date().getFullYear()} Tourisme Togo — Projet open source sous licence MIT.</span>
      <span>Données touristiques fournies par les contributeurs du projet.</span>
    </div>`;
}
