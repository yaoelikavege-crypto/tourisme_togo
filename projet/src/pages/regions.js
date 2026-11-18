// =====================================
// PAGE 3 — RÉGIONS
// =====================================

import {
  REGIONS,
  REGION_INFO,
  echapper,
  trierParNom,
} from "../store.js";
import { grilleDestinations, enteteSection } from "../composants/pied.js";

// Vue d'ensemble des cinq régions
function vueListe({ conteneur, donnees }) {
  const cartes = REGIONS.map((region) => {
    const lieux = donnees.lieux.filter((l) => l.region === region);
    const image = (lieux.find((l) => l.image) || {}).image;
    const info = REGION_INFO[region];
    const types = [...new Set(lieux.filter((l) => l.type).map((l) => l.type))];

    return `
      <a class="carte-region carte-region--haute" href="#/region/${encodeURIComponent(region)}">
        <div class="carte-region-fond" ${
          image
            ? `style="background-image: linear-gradient(rgba(20,83,45,.35), rgba(20,83,45,.82)), url('${image}')"`
            : ""
        }></div>
        <div class="carte-region-corps">
          <span class="carte-region-compte">${lieux.length} destination${lieux.length > 1 ? "s" : ""}</span>
          <h3>${echapper(region)}</h3>
          <p>${echapper(info.resume)}</p>
          <span class="carte-region-lien">Explorer le ${echapper(region)} →</span>
          <span class="carte-region-types">
            ${types.map((t) => `<span class="pastille-type">${t}</span>`).join("")}
          </span>
        </div>
      </a>`;
  }).join("");

  conteneur.innerHTML = `
    <section class="section section--ivoire">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "Territoire",
          titre: "Les cinq régions du Togo",
          texte:
            "Du nord soudanien aux lagunes de la côte, chaque région a son climat, ses cultures et ses paysages. Choisissez une région pour découvrir ses destinations.",
        })}
        <div class="grille-regions grille-regions--haute">${cartes}</div>
      </div>
    </section>`;

  return null;
}

// Vue d'une région
function vueRegion({ conteneur, donnees, parametre }) {
  const region = REGIONS.find(
    (r) => r.toLowerCase() === decodeURIComponent(parametre || "").toLowerCase(),
  );

  if (!region) {
    conteneur.innerHTML = `
      <section class="section">
        <div class="conteneur">
          <span class="surtitre">Introuvable</span>
          <h1>Région inconnue</h1>
          <p>Les cinq régions disponibles sont : ${REGIONS.join(", ")}.</p>
          <a class="btn btn--principal" href="#/regions">Voir les régions</a>
        </div>
      </section>`;
    return null;
  }

  const info = REGION_INFO[region];
  const lieux = trierParNom(donnees.lieux.filter((l) => l.region === region));
  const villes = lieux.filter((l) => l.categorie === "ville");
  const sites = lieux.filter((l) => l.categorie === "site");
  const image = (lieux.find((l) => l.image) || {}).image;

  const types = [...new Set(sites.map((l) => l.type).filter(Boolean))];

  document.title = `${region} — Tourisme Togo`;

  conteneur.innerHTML = `
    <nav class="fil-ariane">
      <div class="conteneur">
        <a href="#/">Accueil</a><span aria-hidden="true">/</span>
        <a href="#/regions">Régions</a><span aria-hidden="true">/</span>
        <span aria-current="page">${echapper(region)}</span>
      </div>
    </nav>

    <section class="region-hero" ${
      image
        ? `style="background-image: linear-gradient(rgba(20,83,45,.55), rgba(20,83,45,.85)), url('${image}')"`
        : ""
    }>
      <div class="conteneur">
        <span class="hero-surtitre">Région</span>
        <h1>${echapper(region)}</h1>
        <p class="hero-texte">${echapper(info.resume)}</p>
        <p class="region-meta">
          Chef-lieu : <strong>${echapper(info.chefLieu)}</strong>
          · ${lieux.length} destinations recensées
          · ${villes.length} ville${villes.length > 1 ? "s" : ""}
          · ${sites.length} site${sites.length > 1 ? "s" : ""}
        </p>
      </div>
    </section>

    <section class="section section--blanc">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "Villes",
          titre: `Les villes du ${echapper(region)}`,
          texte: "Chefs-lieux et villes secondaires de la région.",
        })}
        ${grilleDestinations(villes, { ratio: "paysage", description: false })}
      </div>
    </section>

    <section class="section section--ivoire">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "Sites touristiques",
          titre: `À visiter dans le ${echapper(region)}`,
          texte: types.length
            ? `Types représentés : ${types.join(", ")}.`
            : "Les sites de la région seront ajoutés prochainement.",
        })}
        ${grilleDestinations(sites, { ratio: "paysage", description: true })}
      </div>
    </section>
  `;

  return null;
}

export default async function pageRegions({ conteneur, donnees, parametre, chemin }) {
  // chemin : /regions  ou  /region/Maritime
  if (chemin.startsWith("/region/")) {
    return vueRegion({ conteneur, donnees, parametre });
  }

  return vueListe({ conteneur, donnees });
}
