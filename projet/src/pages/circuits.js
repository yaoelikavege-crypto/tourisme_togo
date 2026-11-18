// =====================================
// PAGE 6 — CIRCUITS TOURISTIQUES
// =====================================
// Les circuits proposés ici sont CONSTRUITS À PARTIR DES COORDONNÉES RÉELLES
// des destinations de la base. Les distances sont calculées à vol d'oiseau.
// Ils sont explicitement présentés comme des suggestions, pas comme des
// produits touristiques commerciaux.

import L from "leaflet";
import "leaflet.markercluster";

import {
  echapper,
  distanceKm,
  libelleType,
  classeType,
  lienItineraire,
} from "../store.js";

// Circuits : suite d'identifiants de lieux existants
const CIRCUITS = [
  {
    id: "cascades",
    titre: "Cascades et montagnes du sud-ouest",
    resume:
      "Un parcours dans la région des Plateaux, entre Kpalimé, les cascades et le toit du Togo.",
    etapes: [
      ["ville", 7], // Kpalimé
      ["site", 1], // Cascade de Womé
      ["site", 3], // Mont Agou
      ["site", 2], // Cascade de Kpimé
      ["ville", 9], // Badou
    ],
  },
  {
    id: "memoire",
    titre: "Mémoire et lagunes",
    resume:
      "Les rives du lac Togo : histoire du protectorat, mémoire de la traite et plages de l'Atlantique.",
    etapes: [
      ["ville", 1], // Lomé
      ["site", 15], // Marché des féticheurs
      ["site", 12], // Togoville
      ["site", 13], // Maison des esclaves
      ["site", 21], // Plage d'Agbodrafo
    ],
  },
  {
    id: "nord",
    titre: "Le grand nord et le Koutammakou",
    resume:
      "De la savane des Savanes aux maisons-tours Batammariba, en passant par Kara et ses montagnes.",
    etapes: [
      ["ville", 22], // Dapaong
      ["site", 9], // Grottes de Nok
      ["ville", 23], // Mango
      ["site", 11], // Koutammakou
      ["ville", 16], // Kara
    ],
  },
];

function construireCircuit(donnees, definition) {
  const etapes = definition.etapes
    .map(([categorie, id]) =>
      donnees.lieux.find((l) => l.categorie === categorie && l.id === id),
    )
    .filter(Boolean);

  if (etapes.length < 2) return null;

  // Distances successives et cumul
  const segments = [];
  let total = 0;

  for (let i = 0; i < etapes.length - 1; i += 1) {
    const d = distanceKm(etapes[i], etapes[i + 1]);
    segments.push(d);
    total += d;
  }

  return { ...definition, etapes, segments, total: Math.round(total * 10) / 10 };
}

export default async function pageCircuits({ conteneur, donnees }) {
  const circuits = CIRCUITS.map((c) => construireCircuit(donnees, c)).filter(Boolean);

  conteneur.innerHTML = `
    <section class="section section--ivoire section--serre">
      <div class="conteneur">
        <span class="surtitre">Itinéraires</span>
        <h1>Circuits touristiques</h1>
        <p class="catalogue-compte">
          Trois suggestions construites à partir des destinations réellement
          répertoriées. Les distances indiquées sont <strong>à vol d'oiseau</strong> :
          les trajets routiers sont plus longs. Ces circuits sont des propositions
          éditoriales, pas des offres commerciales.
        </p>
      </div>
    </section>

    <section class="section section--blanc">
      <div class="conteneur">
        <div class="circuits-liste">
          ${circuits
            .map(
              (circuit) => `
            <article class="circuit" id="circuit-${circuit.id}">
              <header class="circuit-entete">
                <div>
                  <span class="surtitre">Circuit ${circuit.etapes.length} étapes</span>
                  <h2>${echapper(circuit.titre)}</h2>
                  <p>${echapper(circuit.resume)}</p>
                </div>
                <div class="circuit-distance">
                  <strong>${circuit.total}</strong>
                  <span>km à vol d'oiseau</span>
                </div>
              </header>

              <ol class="circuit-etapes">
                ${circuit.etapes
                  .map(
                    (etape, index) => `
                  <li class="circuit-etape">
                    <span class="circuit-numero">${index + 1}</span>
                    <div class="circuit-etape-corps">
                      <a href="#/destination/${etape.categorie}/${etape.id}">
                        ${echapper(etape.nom)}
                      </a>
                      <span class="circuit-etape-meta">
                        <span class="etiquette ${classeType(etape)}">${libelleType(etape)}</span>
                        Région ${echapper(etape.region)}
                      </span>
                      ${
                        index > 0
                          ? `<span class="circuit-segment">↳ ${circuit.segments[index - 1]} km depuis l'étape précédente</span>`
                          : ""
                      }
                    </div>
                  </li>`,
                  )
                  .join("")}
              </ol>

              <div class="circuit-actions">
                <a
                  class="btn btn--principal btn--petit"
                  href="${lienItineraire(circuit.etapes[0])}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Démarrer à ${echapper(circuit.etapes[0].nom)}
                </a>
                <button
                  class="btn btn--secondaire btn--petit"
                  type="button"
                  data-afficher="${circuit.id}"
                >
                  Afficher sur la carte
                </button>
              </div>
            </article>`,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section section--ivoire">
      <div class="conteneur">
        <h2>Carte des circuits</h2>
        <div id="carte-circuits" class="carte-circuits"></div>
      </div>
    </section>
  `;

  // ---- Carte : un tracé par circuit
  const map = L.map("carte-circuits", { center: [8.4, 0.9], zoom: 6 });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    maxNativeZoom: 19,
  }).addTo(map);

  const couleurCircuit = { cascades: "#166534", memoire: "#166A8F", nord: "#B4674A" };

  const couches = {};

  circuits.forEach((circuit) => {
    const coordonnees = circuit.etapes.map((e) => [e.latitude, e.longitude]);
    const couleur = couleurCircuit[circuit.id] || "#14532D";

    const trace = L.polyline(coordonnees, {
      color: couleur,
      weight: 3,
      opacity: 0.85,
      dashArray: "7 6",
    });

    const groupe = L.layerGroup([
      trace,
      ...circuit.etapes.map((etape, i) =>
        L.circleMarker([etape.latitude, etape.longitude], {
          radius: 7,
          color: "#ffffff",
          weight: 2.5,
          fillColor: couleur,
          fillOpacity: 1,
        }).bindTooltip(`${i + 1}. ${etape.nom}`),
      ),
    ]);

    couches[circuit.id] = groupe;
    groupe.addTo(map);
  });

  const bounds = L.latLngBounds(
    circuits.flatMap((c) => c.etapes.map((e) => [e.latitude, e.longitude])),
  );
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] });

  // ---- Boutons « Afficher sur la carte »
  conteneur.querySelectorAll("[data-afficher]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      Object.values(couches).forEach((c) => map.removeLayer(c));

      const circuit = couches[bouton.dataset.afficher];
      if (!circuit) return;

      circuit.addTo(map);
      map.fitBounds(L.latLngBounds(circuit.getLayers()[0].getLatLngs()[0]), {
        padding: [30, 30],
      });
      map.getContainer().scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  setTimeout(() => map.invalidateSize(), 80);

  return () => map.remove();
}
