// =====================================
// PAGE 7 — CULTURE ET PATRIMOINE
// =====================================
// Contenu éditorial statique. Aucune donnée chiffrée n'est inventée :
// les informations sont descriptives et générales. Les renvois vers des
// fiches de sites pointent vers les données réellement présentes.

import { echapper } from "../store.js";
import { grilleDestinations } from "../composants/pied.js";

const RUBRIQUES = [
  {
    titre: "Le Koutammakou, patrimoine mondial",
    texte:
      "Dans la région de Kara, le pays des Batammariba abrite les takienta, maisons-tours en terre crue toujours habitées. Le site est inscrit sur la liste du patrimoine mondial de l'UNESCO. La visite se fait dans le respect des habitants, accompagné d'un guide local.",
    lieuCible: ["site", 11],
  },
  {
    titre: "Togoville et l'histoire du protectorat",
    texte:
      "Sur la rive nord du lac Togo, Togoville conserve la mémoire du traité signé en 1884 entre le roi Mlapa III et l'explorateur allemand Gustav Nachtigal. Le village reste aujourd'hui un haut lieu du culte vaudou, avec sa cathédrale et son palais royal.",
    lieuCible: ["site", 12],
  },
  {
    titre: "La mémoire de la traite atlantique",
    texte:
      "À Agbodrafo, la Maison Wood — dite Maison des esclaves — fut construite en 1835 par un négociant écossais. Sa cave basse servait à détenir des captifs avant la traversée. C'est aujourd'hui un lieu de mémoire visitable, à quelques minutes des plages.",
    lieuCible: ["site", 13],
  },
  {
    titre: "Marchés et savoir-faire",
    texte:
      "Batik et tissage à Kpalimé, sculpture sur bois, poterie et vannerie : l'artisanat togolais se transmet dans des ateliers familiaux. Le marché des féticheurs d'Akodesséwa, au nord de Lomé, rassemble plantes médicinales et objets rituels — une visite guidée y est recommandée.",
    lieuCible: ["site", 15],
  },
  {
    titre: "Fêtes et traditions",
    texte:
      "De la fête de l'Adossa chez les Tem à l'Agbogbozan de Notsé, en passant par l'Evala du pays kabyè,Adzifozan et Ayizan a Tsevié, le calendrier togolais est rythmé par des cérémonies communautaires. Les dates varient chaque année : renseignez-vous auprès des offices de tourisme locaux ou aupres du ministere du tourisme.",
    lieuCible: ["site", 14],
  },
];

const GASTRONOMIE = [
  {
    nom: "Fufu",
    texte:
      "Pâte d'igname ou de manioc pilée, servie avec une sauce à base d'arachide, de tomate ou de gombo.",
  },
  {
    nom: "Ablo",
    texte:
      "Beignets de maïs fermenté cuits à la vapeur dans des feuilles, souvent vendus au bord des routes.",
  },
  {
    nom: "Akume",
    texte:
      "Pâte de maïs, accompagnement courant dans le nord du pays, servie avec des sauces de feuilles.",
  },
  {
    nom: "Poisson braisé",
    texte:
      "Sur la côte, le poisson grillé au feu de bois accompagne les soirées des plages de Baguida et d'Agbodrafo.",
  },
];

export default async function pageCulture({ conteneur, donnees }) {
  const patrimoine = donnees.lieux.filter((l) => l.type === "patrimoine");

  const lienLieu = ([categorie, id]) => {
    const lieu = donnees.lieux.find(
      (l) => l.categorie === categorie && l.id === id,
    );
    if (!lieu) return "";
    return `<a class="carte-lien" href="#/destination/${lieu.categorie}/${lieu.id}">Voir la fiche : ${echapper(lieu.nom)} →</a>`;
  };

  conteneur.innerHTML = `
    <section class="section section--ivoire section--serre">
      <div class="conteneur">
        <span class="surtitre">Éditorial</span>
        <h1>Culture &amp; patrimoine</h1>
        <p class="catalogue-compte">
          Traditions, histoire et savoir-faire du Togo : ce que l'on découvre
          entre deux destinations.
        </p>
      </div>
    </section>

    <section class="section section--blanc">
      <div class="conteneur">
        <div class="editorial-grille">
          ${RUBRIQUES.map(
            (rubrique) => `
            <article class="editorial-bloc">
              <h2>${echapper(rubrique.titre)}</h2>
              <p>${echapper(rubrique.texte)}</p>
              ${lienLieu(rubrique.lieuCible)}
            </article>`,
          ).join("")}
        </div>
      </div>
    </section>

    <section class="section section--ivoire">
      <div class="conteneur">
        <h2>Gastronomie</h2>
        <p class="catalogue-compte">Quelques plats que l'on retrouve sur tout le territoire.</p>
        <div class="grille-atouts">
          ${GASTRONOMIE.map(
            (plat) => `
            <article class="atout">
              <h3>${echapper(plat.nom)}</h3>
              <p>${echapper(plat.texte)}</p>
            </article>`,
          ).join("")}
        </div>
      </div>
    </section>

    <section class="section section--blanc">
      <div class="conteneur">
        <h2>Les sites patrimoniaux recensés</h2>
        <p class="catalogue-compte">
          ${patrimoine.length} destinations classées « patrimoine » dans notre base.
        </p>
        ${grilleDestinations(patrimoine, { ratio: "paysage", description: false })}
      </div>
    </section>
  `;

  return null;
}
