// =====================================
// PAGE 5 — FICHE DÉTAILLÉE D'UNE DESTINATION
// =====================================

import L from "leaflet";

import {
  echapper,
  visuel,
  libelleType,
  classeType,
  formaterCoordonnees,
  formaterPopulation,
  lienItineraire,
  lieuxProches,
} from "../store.js";

function etat404() {
  return `
    <section class="section">
      <div class="conteneur">
        <span class="surtitre">Introuvable</span>
        <h1>Cette destination n'existe pas</h1>
        <p>Le lieu demandé ne figure pas dans notre base. Il a peut-être été déplacé ou renommé.</p>
        <a class="btn btn--principal" href="#/destinations">Voir toutes les destinations</a>
      </div>
    </section>`;
}

export default async function pageDetail({ conteneur, donnees, chemin }) {
  // chemin : /destination/site/12
  const morceaux = chemin.split("/").filter(Boolean);
  const categorie = morceaux[1];
  const id = Number(morceaux[2]);

  const lieu = donnees.lieux.find(
    (l) => l.id === id && l.categorie === categorie,
  );

  if (!lieu) {
    conteneur.innerHTML = etat404();
    return null;
  }

  const proches = lieuxProches(lieu, donnees.lieux, 4).map((x) => x.lieu);

  document.title = `${lieu.nom} — Tourisme Togo`;

  conteneur.innerHTML = `
    <nav class="fil-ariane" aria-label="Fil d'Ariane">
      <div class="conteneur">
        <a href="#/">Accueil</a>
        <span aria-hidden="true">/</span>
        <a href="#/destinations">Destinations</a>
        <span aria-hidden="true">/</span>
        <a href="#/region/${encodeURIComponent(lieu.region)}">${echapper(lieu.region)}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${echapper(lieu.nom)}</span>
      </div>
    </nav>

    <article class="fiche">
      <div class="fiche-hero">
        <div class="conteneur">
          <span class="etiquette ${classeType(lieu)}">${libelleType(lieu)}</span>
          <h1>${echapper(lieu.nom)}</h1>
          <p class="fiche-sous-titre">Région ${echapper(lieu.region)}</p>
        </div>
      </div>

      <div class="conteneur fiche-corps">
        <div class="fiche-principal">
          ${visuel(lieu, "large")}

          <section class="bloc">
            <h2>À propos</h2>
            <p class="fiche-description">${echapper(lieu.description)}</p>
          </section>

          <section class="bloc">
            <h2>Informations géographiques</h2>
            <dl class="fiche-infos">
              <div>
                <dt>Latitude</dt>
                <dd><code>${Number(lieu.latitude).toFixed(4)}</code></dd>
              </div>
              <div>
                <dt>Longitude</dt>
                <dd><code>${Number(lieu.longitude).toFixed(4)}</code></dd>
              </div>
              <div>
                <dt>Région</dt>
                <dd>${echapper(lieu.region)}</dd>
              </div>
              <div>
                <dt>Catégorie</dt>
                <dd>${libelleType(lieu)}</dd>
              </div>
              ${
                lieu.population
                  ? `<div><dt>Population</dt><dd>${formaterPopulation(lieu.population)}</dd></div>`
                  : ""
              }
            </dl>
            <p class="fiche-note">
              Coordonnées GPS : ${formaterCoordonnees(lieu)}. La précision peut varier
              de quelques dizaines de mètres selon la source.
            </p>
          </section>

          <section class="bloc">
            <div id="carte-fiche" class="carte-fiche" aria-label="Localisation de ${echapper(lieu.nom)}"></div>
          </section>
        </div>

        <aside class="fiche-lateral">
          <div class="encart">
            <h2>Préparer la visite</h2>
            <a
              class="btn btn--principal"
              href="${lienItineraire(lieu)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Obtenir l'itinéraire
            </a>
            <button class="btn btn--secondaire" id="bouton-partage" type="button">
              Partager cette destination
            </button>
            <p class="encart-note" id="partage-note" role="status"></p>
          </div>
        </aside>
      </div>

      ${
        proches.length
          ? `<section class="section section--ivoire">
              <div class="conteneur">
                <h2>À proximité</h2>
                <div class="grille-destinations">
                  ${proches
                    .map(
                      (p) => `
                    <article class="carte-destination">
                      <a href="#/destination/${p.categorie}/${p.id}">${visuel(p, "paysage")}</a>
                      <div class="carte-corps">
                        <div class="carte-meta">
                          <span class="etiquette ${classeType(p)}">${libelleType(p)}</span>
                        </div>
                        <h3 class="carte-titre">
                          <a href="#/destination/${p.categorie}/${p.id}">${echapper(p.nom)}</a>
                        </h3>
                      </div>
                    </article>`,
                    )
                    .join("")}
                </div>
              </div>
            </section>`
          : ""
      }
    </article>
  `;

  // ---- Mini-carte de localisation
  const map = L.map("carte-fiche", {
    center: [lieu.latitude, lieu.longitude],
    zoom: 11,
    scrollWheelZoom: false,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    maxNativeZoom: 19,
  }).addTo(map);

  L.circleMarker([lieu.latitude, lieu.longitude], {
    radius: 9,
    color: "#ffffff",
    weight: 3,
    fillColor: "#166534",
    fillOpacity: 1,
  })
    .addTo(map)
    .bindPopup(`${echapper(lieu.nom)}<br><code>${formaterCoordonnees(lieu)}</code>`)
    .openPopup();

  // ---- Partage
  const boutonPartage = conteneur.querySelector("#bouton-partage");
  const note = conteneur.querySelector("#partage-note");

  boutonPartage.addEventListener("click", async () => {
    const url = window.location.href;
    const donneesPartage = { title: `${lieu.nom} — Tourisme Togo`, url };

    try {
      if (navigator.share) {
        await navigator.share(donneesPartage);
        note.textContent = "Partagé.";
        return;
      }

      await navigator.clipboard.writeText(url);
      note.textContent = "Lien copié dans le presse-papiers.";
    } catch (erreur) {
      note.textContent = `Copiez ce lien : ${url}`;
    }
  });

  setTimeout(() => map.invalidateSize(), 80);

  return () => map.remove();
}
