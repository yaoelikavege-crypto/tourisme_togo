// =====================================
// PAGE 1 — ACCUEIL
// =====================================

import { REGIONS, REGION_INFO, echapper, normaliser } from "../store.js";
import { grilleDestinations, enteteSection } from "../composants/pied.js";

// Sélection éditoriale : on privilégie les lieux qui ont une image réelle
function selectionDestinations(lieux) {
  const avecImage = lieux.filter((l) => l.image && l.categorie === "site");
  const sansImage = lieux.filter((l) => !l.image && l.categorie === "site");

  return [...avecImage, ...sansImage].slice(0, 7);
}

function imageHero(lieux) {
  // La plus grande image disponible sert de fond de hero
  const candidates = lieux.filter((l) => l.image && l.categorie === "site");
  const preferees = [
    "cascade_wome.jpg",
    "kpalime_vu_haut.jpg",
    "lome_vu_haut.jpg",
    "kara.jpg",
  ];

  for (const nom of preferees) {
    const trouve = candidates.find((l) => l.image.endsWith(nom));
    if (trouve) return trouve.image;
  }

  return candidates.length ? candidates[0].image : null;
}

export default async function pageAccueil({ conteneur, donnees }) {
  const { lieux, villes, sites } = donnees;
  const hero = imageHero(lieux);
  const selection = selectionDestinations(lieux);
  const parRegion = REGIONS.map((region) => ({
    region,
    nombre: lieux.filter((l) => l.region === region).length,
  }));

  const imageRegion = (region) => {
    const lieu = lieux.find((l) => l.region === region && l.image);
    return lieu ? lieu.image : null;
  };

  conteneur.innerHTML = `
    <!-- HERO -->
    <section class="hero" ${hero ? `style="background-image: linear-gradient(rgba(20, 83, 45, .62), rgba(20, 83, 45, .78)), url('${hero}')"` : ""}>
      <div class="hero-inner">
        <span class="hero-surtitre">République togolaise · Afrique de l'Ouest</span>
        <h1>Le Togo, une terre de découvertes.</h1>
        <p class="hero-texte">
          Des cascades de Kpalimé aux maisons-tours du Koutammakou, des plages du Golfe
          de Guinée aux savanes du nord : explorez les cinq régions du Togo à travers
          ${lieux.length} destinations géolocalisées.
        </p>

        <form class="hero-recherche" id="recherche-hero" role="search">
          <label class="sr-only" for="champ-hero">Rechercher une destination</label>
          <input
            id="champ-hero"
            type="search"
            name="q"
            placeholder="Une ville, un site, une région…"
            autocomplete="off"
          >
          <button type="submit" class="btn btn--principal">Rechercher</button>
        </form>

        <div class="hero-actions">
          <a class="btn btn--principal" href="#/destinations">Explorer les destinations</a>
          <a class="btn btn--fantome" href="#/explorer">Découvrir la carte</a>
        </div>

        <p class="hero-resultat" id="hero-resultat" role="status"></p>
      </div>
    </section>

    <div class="bandeau-chiffres">
      <div class="bandeau-inner">
        <div><strong>${villes.length}</strong><span>villes recensées</span></div>
        <div><strong>${sites.length}</strong><span>sites touristiques</span></div>
        <div><strong>5</strong><span>régions couvertes</span></div>
        <div><strong>${lieux.filter((l) => l.image).length}</strong><span>photographies</span></div>
      </div>
    </div>

    <!-- DESTINATIONS -->
    <section class="section section--ivoire">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "À découvrir",
          titre: "Destinations à ne pas manquer",
          texte:
            "Une sélection de sites naturels, patrimoniaux et balnéaires répartis sur tout le territoire.",
          action: `<a class="btn btn--secondaire btn--petit" href="#/destinations">Tout voir</a>`,
        })}
        ${grilleDestinations(selection, { editoriale: true, description: true })}
      </div>
    </section>

    <!-- RÉGIONS -->
    <section class="section section--blanc">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "Territoire",
          titre: "Les cinq régions du Togo",
          texte:
            "Du nord soudanien aux lagunes du sud, chaque région possède son climat, ses cultures et ses paysages.",
        })}

        <div class="grille-regions">
          ${parRegion
            .map(({ region, nombre }) => {
              const image = imageRegion(region);
              const info = REGION_INFO[region];
              return `
                <a class="carte-region" href="#/region/${encodeURIComponent(region)}">
                  <div class="carte-region-fond" ${
                    image
                      ? `style="background-image: linear-gradient(rgba(20,83,45,.45), rgba(20,83,45,.8)), url('${image}')"`
                      : ""
                  }></div>
                  <div class="carte-region-corps">
                    <span class="carte-region-compte">${nombre} destination${nombre > 1 ? "s" : ""}</span>
                    <h3>${echapper(region)}</h3>
                    <p>${echapper(info.resume)}</p>
                    <span class="carte-region-lien">Découvrir la région →</span>
                  </div>
                </a>`;
            })
            .join("")}
        </div>
      </div>
    </section>

    <!-- POURQUOI LE TOGO -->
    <section class="section section--ivoire">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "Pourquoi venir",
          titre: "Un pays, cinq expériences",
          texte:
            "Peu de pays offrent une telle densité de paysages et de cultures sur à peine 700 kilomètres du nord au sud.",
        })}

        <div class="grille-atouts">
          <article class="atout">
            <span class="atout-numero">01</span>
            <h3>Richesse naturelle</h3>
            <p>Cascades, forêts-galeries, savanes et le point culminant du pays, le mont Agou (986 m).</p>
          </article>
          <article class="atout">
            <span class="atout-numero">02</span>
            <h3>Patrimoine culturel</h3>
            <p>Le Koutammakou et ses maisons-tours sont inscrits au patrimoine mondial de l'UNESCO.</p>
          </article>
          <article class="atout">
            <span class="atout-numero">03</span>
            <h3>Diversité géographique</h3>
            <p>Plages de sable, lagunes, collines et savanes du nord en un seul voyage.</p>
          </article>
          <article class="atout">
            <span class="atout-numero">04</span>
            <h3>Artisanat et traditions</h3>
            <p>Batik, sculpture sur bois, tissage, poterie et fêtes traditionnelles tout au long de l'année.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- APPEL À L'ACTION -->
    <section class="section section--vert">
      <div class="conteneur cta">
        <div>
          <span class="surtitre">Carte interactive</span>
          <h2>Repérez chaque destination avant de partir</h2>
          <p>
            Filtrez par région et par type, consultez les coordonnées GPS et préparez
            votre itinéraire depuis la carte.
          </p>
        </div>
        <a class="btn btn--secondaire" href="#/explorer">Ouvrir la carte</a>
      </div>
    </section>
  `;

  // ---- Recherche du hero : redirection vers la page Explorer
  const formulaire = conteneur.querySelector("#recherche-hero");
  const champ = conteneur.querySelector("#champ-hero");
  const resultat = conteneur.querySelector("#hero-resultat");

  formulaire.addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    const requete = champ.value.trim();

    if (!requete) {
      resultat.textContent = "Saisissez le nom d'un lieu pour lancer la recherche.";
      return;
    }

    location.hash = `#/explorer?q=${encodeURIComponent(requete)}`;
  });

  // Aperçu en direct du nombre de résultats
  champ.addEventListener("input", () => {
    const requete = normaliser(champ.value.trim());

    if (!requete) {
      resultat.textContent = "";
      return;
    }

    const nombre = lieux.filter(
      (l) =>
        normaliser(l.nom).includes(requete) ||
        normaliser(l.region).includes(requete),
    ).length;

    resultat.textContent =
      nombre === 0
        ? "Aucun lieu ne correspond à cette recherche."
        : `${nombre} lieu${nombre > 1 ? "x" : ""} correspond${nombre > 1 ? "ent" : ""} à « ${champ.value.trim()} ».`;

    });

  return null;
}
