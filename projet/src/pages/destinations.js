// =====================================
// PAGE 4 — CATALOGUE DES DESTINATIONS
// =====================================

import {
  REGIONS,
  TYPES,
  echapper,
  normaliser,
  trierParNom,
} from "../store.js";
import { carteDestination, enteteSection } from "../composants/pied.js";

const PAR_PAGE = 12;

export default async function pageDestinations({ conteneur, donnees }) {
  const etat = {
    recherche: "",
    region: "",
    categorie: "",
    typeSelect: "",
    tri: "nom",
    page: 1,
  };

  conteneur.innerHTML = `
    <section class="section section--ivoire section--serre">
      <div class="conteneur">
        ${enteteSection({
          surtitre: "Catalogue",
          titre: "Toutes les destinations",
          texte: "Filtrez les villes et les sites touristiques des cinq régions du Togo.",
        })}
      </div>
    </section>

    <section class="section section--blanc">
      <div class="conteneur">
        <div class="catalogue-barre">
          <div class="explorer-champ catalogue-recherche">
            <label for="c-recherche">Rechercher</label>
            <input id="c-recherche" type="search" placeholder="Nom, région…" autocomplete="off">
          </div>

          <div class="explorer-champ">
            <label for="c-region">Région</label>
            <select id="c-region">
              <option value="">Toutes</option>
              ${REGIONS.map((r) => `<option value="${r}">${r}</option>`).join("")}
            </select>
          </div>

          <div class="explorer-champ">
            <label for="c-categorie">Catégorie</label>
            <select id="c-categorie">
              <option value="">Toutes</option>
              <option value="ville">Villes</option>
              <option value="site">Sites</option>
            </select>
          </div>

          <div class="explorer-champ">
            <label for="c-type">Type</label>
            <select id="c-type">
              <option value="">Tous</option>
              ${Object.entries(TYPES)
                .map(([cle, t]) => `<option value="${cle}">${t.libelle}</option>`)
                .join("")}
            </select>
          </div>

          <div class="explorer-champ">
            <label for="c-tri">Trier par</label>
            <select id="c-tri">
              <option value="nom">Nom (A→Z)</option>
              <option value="region">Région</option>
            </select>
          </div>

          <button class="btn btn--secondaire btn--petit" id="c-reset" type="button">Réinitialiser</button>
        </div>

        <p class="catalogue-compte" id="c-compte" role="status"></p>
        <div id="c-resultats"></div>
        <div class="catalogue-pagination" id="c-pagination"></div>
      </div>
    </section>
  `;

  const champ = conteneur.querySelector("#c-recherche");
  const champRegion = conteneur.querySelector("#c-region");
  const champCategorie = conteneur.querySelector("#c-categorie");
  const champType = conteneur.querySelector("#c-type");
  const champTri = conteneur.querySelector("#c-tri");
  const boutonReset = conteneur.querySelector("#c-reset");
  const zone = conteneur.querySelector("#c-resultats");
  const compte = conteneur.querySelector("#c-compte");
  const pagination = conteneur.querySelector("#c-pagination");

  function filtrer() {
    return donnees.lieux.filter((lieu) => {
      const requete = normaliser(etat.recherche);

      if (requete) {
        const champs = [normaliser(lieu.nom), normaliser(lieu.region)];
        if (!champs.some((v) => v.includes(requete))) return false;
      }

      if (etat.region && lieu.region !== etat.region) return false;
      if (etat.categorie && lieu.categorie !== etat.categorie) return false;
      if (etat.typeSelect && lieu.type !== etat.typeSelect) return false;

      return true;
    });
  }

  function afficher() {
    let resultats = filtrer();

    resultats =
      etat.tri === "region"
        ? [...resultats].sort(
            (a, b) =>
              a.region.localeCompare(b.region, "fr") ||
              a.nom.localeCompare(b.nom, "fr"),
          )
        : trierParNom(resultats);

    compte.textContent = `${resultats.length} destination${resultats.length > 1 ? "s" : ""}`;

    const pages = Math.max(1, Math.ceil(resultats.length / PAR_PAGE));
    if (etat.page > pages) etat.page = pages;

    const debut = (etat.page - 1) * PAR_PAGE;
    const page = resultats.slice(debut, debut + PAR_PAGE);

    if (!resultats.length) {
      zone.innerHTML = `
        <div class="etat etat--vide">
          <p>Aucune destination ne correspond à ces critères.</p>
          <button type="button" class="btn btn--secondaire btn--petit" id="vider">
            Effacer les filtres
          </button>
        </div>`;
      pagination.innerHTML = "";
      const vider = zone.querySelector("#vider");
      if (vider) vider.addEventListener("click", reinitialiser);
      return;
    }

    zone.innerHTML = `
      <div class="grille-destinations">
        ${page.map((lieu) => carteDestination(lieu, { ratio: "paysage" })).join("")}
      </div>`;

    // Pagination
    if (pages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    const boutons = [];
    for (let i = 1; i <= pages; i += 1) {
      boutons.push(
        `<button type="button" class="btn btn--petit ${
          i === etat.page ? "btn--principal" : "btn--secondaire"
        }" data-page="${i}" ${
          i === etat.page ? 'aria-current="page"' : ""
        }>${i}</button>`,
      );
    }

    pagination.innerHTML = `
      <span class="pagination-info">Page ${etat.page} sur ${pages}</span>
      <div class="pagination-boutons">${boutons.join("")}</div>`;
  }

  function reinitialiser() {
    etat.recherche = "";
    etat.region = "";
    etat.categorie = "";
    etat.typeSelect = "";
    etat.tri = "nom";
    etat.page = 1;

    champ.value = "";
    champRegion.value = "";
    champCategorie.value = "";
    champType.value = "";
    champTri.value = "nom";

    afficher();
  }

  // ---- Écouteurs
  let minuterie = null;
  champ.addEventListener("input", () => {
    etat.recherche = champ.value;
    etat.page = 1;
    clearTimeout(minuterie);
    minuterie = setTimeout(afficher, 160);
  });

  [
    [champRegion, "region"],
    [champCategorie, "categorie"],
    [champType, "typeSelect"],
    [champTri, "tri"],
  ].forEach(([element, cle]) => {
    element.addEventListener("change", () => {
      etat[cle] = element.value;
      etat.page = 1;
      afficher();
    });
  });

  boutonReset.addEventListener("click", reinitialiser);

  pagination.addEventListener("click", (evenement) => {
    const bouton = evenement.target.closest("[data-page]");
    if (!bouton) return;
    etat.page = Number(bouton.dataset.page);
    afficher();
    zone.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  afficher();

  return () => clearTimeout(minuterie);
}
