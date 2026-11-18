// =====================================
// 1. INITIALISATION DE LA CARTE
// =====================================

const map = L.map("map").setView([8.6, 0.8], 9);

// =====================================
// 2. AJOUT DU FOND CARTOGRAPHIQUE
// =====================================

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  maxZoom: 19,
  maxNativeZoom: 19,
}).addTo(map);

// =====================================
// 3. CHARGEMENT DES FRONTIÈRES DU TOGO
// =====================================

// Palette touristique des régions du Togo
const couleursRegions = {
  "TG-S": "#D99A22", // Savanes : ocre doré
  "TG-K": "#C44936", // Kara : rouge latérite
  "TG-C": "#8A9B32", // Centrale : vert olive
  "TG-P": "#176B45", // Plateaux : vert forêt
  "TG-M": "#168AAD", // Maritime : bleu océan
};

// Chargement coordonné des fichiers GeoJSON
Promise.all([fetch("data/togo.geojson"), fetch("data/togo_regions.geojson")])

  .then(async ([responseTogo, responseRegions]) => {
    // Vérification des réponses HTTP
    if (!responseTogo.ok) {
      throw new Error("Impossible de charger les frontières du Togo");
    }

    if (!responseRegions.ok) {
      throw new Error("Impossible de charger les régions");
    }

    // Conversion des réponses en JSON
    const [togoData, regionsData] = await Promise.all([
      responseTogo.json(),
      responseRegions.json(),
    ]);

    // 1. Couche des régions
    const regionsLayer = L.geoJSON(regionsData, {
      style: function (feature) {
        const code = feature.properties.shapeISO;

        return {
          color: "#FFFFFF",
          weight: 1.5,
          opacity: 0.9,

          fillColor: couleursRegions[code] || "#64748B",
          fillOpacity: 0.1,

          lineJoin: "round",
        };
      },

      onEachFeature: function (feature, layer) {
        const nom = feature.properties.shapeName;

        layer.bindPopup(`<strong>${nom}</strong>`);
        layer.bindTooltip(nom);
      },
    }).addTo(map);

    // 2. Couche des frontières nationales
    const togoLayer = L.geoJSON(togoData, {
      style: {
        color: "#263746",
        weight: 3,
        opacity: 1,

        fill: false,

        lineJoin: "round",
      },
    }).addTo(map);

    // 3. Garantir que le contour national reste au-dessus
    togoLayer.bringToFront();

    // 4. Adapter le zoom aux frontières nationales
    map.fitBounds(togoLayer.getBounds(), {
      padding: [15, 15],
    });

    console.log("Carte touristique du Togo chargée !");
    console.log("Régions et frontières nationales affichées.");
  })

  .catch((error) => {
    console.error("Erreur de chargement :", error);
  });

// =====================================
// 4. VILLES ET SITES
// =====================================

// Icônes distinctes : une pastille bleue pour les villes, verte pour les sites
// Icônes distinctes : bleu pour les villes, puis une couleur par type de site
function pastille(nom) {
  return L.divIcon({
    className: `marqueur-${nom}`,
    html: `<span class="pastille pastille-${nom}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const icones = {
  ville: pastille("ville"),
  site: pastille("site"),
  "site-nature": pastille("site-nature"),
  "site-patrimoine": pastille("site-patrimoine"),
  "site-plage": pastille("site-plage"),
};

// Habillage d'une ville : capitale, chef-lieu ou simple ville
const libellesStatut = {
  capitale: { texte: "Capitale", classe: "etiquette-capitale" },
  "chef-lieu": { texte: "Chef-lieu de région", classe: "etiquette-chef-lieu" },
  ville: { texte: "Ville", classe: "etiquette-ville" },
};

// Habillage d'un site selon son type
const libellesTypeSite = {
  nature: { texte: "Site naturel", classe: "etiquette-nature" },
  patrimoine: { texte: "Patrimoine", classe: "etiquette-patrimoine" },
  plage: { texte: "Plage", classe: "etiquette-plage" },
};

// 2 188 376 -> "2 188 376 hab."
function formaterPopulation(nombre) {
  if (!nombre) {
    return "";
  }

  return `${nombre.toLocaleString("fr-FR")} hab.`;
}

// Le contenu HTML d'une fiche : photo si elle existe, sinon un bloc de remplacement
function construireFiche(lieu) {
  const photo = lieu.image
    ? `<img class="fiche-photo" src="${lieu.image}" alt="${lieu.nom}">`
    : `<div class="fiche-photo fiche-sans-photo">Photo à venir</div>`;

  // Une ville affiche son statut (capitale / chef-lieu / ville), un site son type
  const libelle =
    lieu.categorie === "ville"
      ? libellesStatut[lieu.statut] || libellesStatut.ville
      : libellesTypeSite[lieu.type] || {
          texte: "Site touristique",
          classe: "etiquette-site",
        };

  const etiquette = libelle.texte;
  const classeEtiquette = libelle.classe;

  const population = formaterPopulation(lieu.population);

  return `
    <article class="fiche">
      ${photo}
      <div class="fiche-texte">
        <h3 class="fiche-titre">${lieu.nom}</h3>
        <p class="fiche-meta">
          <span class="etiquette ${classeEtiquette}">${etiquette}</span>
          Région ${lieu.region}
        </p>
        <p class="fiche-description">${lieu.description}</p>
        ${population ? `<p class="fiche-population">${population}</p>` : ""}
      </div>
    </article>
  `;
}

// Chargement d'un fichier JSON avec vérification de la réponse HTTP
function chargerLieux(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Impossible de charger ${url}`);
    }

    return response.json();
  });
}

// =====================================
// 5. LISTE LATÉRALE, DEUX ONGLETS
// =====================================

// Ordre alphabétique français, accents compris
function comparerNoms(a, b) {
  return a.nom.localeCompare(b.nom, "fr");
}

// Étiquette d'un lieu : statut pour une ville, type pour un site
function etiquetteDe(lieu) {
  if (lieu.categorie === "ville") {
    const statut = libellesStatut[lieu.statut] || libellesStatut.ville;
    return { texte: statut.texte, classe: statut.classe };
  }

  return (
    libellesTypeSite[lieu.type] || {
      texte: "Site touristique",
      classe: "etiquette-site",
    }
  );
}

// Construit une entrée de liste ; cliquer dessus centre la carte sur le lieu
function creerEntreeListe(lieu, groupes) {
  const etiquette = etiquetteDe(lieu);
  const entree = document.createElement("li");
  entree.className = "liste-item";
  entree.dataset.nom = lieu.nom.toLowerCase();
  entree.dataset.region = lieu.region.toLowerCase();

  const bouton = document.createElement("button");
  bouton.className = "liste-bouton";
  bouton.type = "button";

  // On construit le texte avec textContent : aucune injection de HTML possible
  const nom = document.createElement("span");
  nom.className = "liste-nom";
  nom.textContent = lieu.nom;

  const details = document.createElement("span");
  details.className = "liste-details";
  details.textContent = `Région ${lieu.region}`;

  const pastilleEtiquette = document.createElement("span");
  pastilleEtiquette.className = `etiquette ${etiquette.classe}`;
  pastilleEtiquette.textContent = etiquette.texte;

  details.prepend(pastilleEtiquette);
  bouton.append(nom, details);
  entree.append(bouton);

  bouton.addEventListener("click", () => {
    // On affiche le groupe qui contient ce lieu, puis on ouvre sa fiche
    groupes[lieu.categorie].addTo(map);
    groupes[lieu.categorie].zoomToShowLayer(lieu.marqueur, () => {
      lieu.marqueur.openPopup();
    });

    // Sur mobile, le panneau laisse la place à la carte
    document.body.classList.remove("panneau-ouvert");
  });

  return entree;
}

// Remplit la liste selon l'onglet actif et la recherche en cours
function afficherListe(etat) {
  const ongletActif = etat.onglet;
  const recherche = etat.recherche.trim().toLowerCase();

  const lieux = ongletActif === "ville" ? etat.villes : etat.sites;

  const correspondants = lieux
    .filter((lieu) => {
      if (!recherche) {
        return true;
      }

      return (
        lieu.nom.toLowerCase().includes(recherche) ||
        lieu.region.toLowerCase().includes(recherche)
      );
    })
    .sort(comparerNoms);

  etat.liste.innerHTML = "";

  if (correspondants.length === 0) {
    const vide = document.createElement("li");
    vide.className = "liste-vide";
    vide.textContent = "Aucun lieu ne correspond à cette recherche.";
    etat.liste.append(vide);
    return;
  }

  correspondants.forEach((lieu) => {
    etat.liste.append(creerEntreeListe(lieu, etat.groupes));
  });
}

// Bascule l'onglet actif et met à jour les compteurs
function activerOnglet(etat, categorie) {
  etat.onglet = categorie;

  document
    .querySelectorAll(".onglet")
    .forEach((bouton) => bouton.classList.remove("onglet--actif"));

  const boutonActif = document.querySelector(
    categorie === "ville" ? "#onglet-villes" : "#onglet-sites",
  );
  boutonActif.classList.add("onglet--actif");
  boutonActif.setAttribute("aria-selected", "true");

  afficherListe(etat);
}

// Villes et sites sont dans deux fichiers séparés : le socle, puis les détails
Promise.all([chargerLieux("data/villes.json"), chargerLieux("data/sites.json")])

  .then(([villes, sites]) => {
    // 1. Un groupe de marqueurs PAR CATÉGORIE : on peut ainsi afficher
    //    les villes seules, les sites seuls, ou les deux.
    const optionsGroupe = {
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 13,
    };

    const groupes = {
      ville: L.markerClusterGroup(optionsGroupe),
      site: L.markerClusterGroup(optionsGroupe),
    };

    // 2. Un marqueur par lieu, mémorisé sur le lieu pour la liste latérale
    const lieux = villes.concat(sites);

    lieux.forEach((lieu) => {
      // Un site utilise son type (nature / patrimoine / plage) pour choisir sa couleur
      const cle =
        lieu.categorie === "site" && lieu.type
          ? `site-${lieu.type}`
          : lieu.categorie;
      const icone = icones[cle] || icones.site;

      lieu.marqueur = L.marker([lieu.latitude, lieu.longitude], { icon: icone })
        .bindPopup(construireFiche(lieu), { maxWidth: 280 })
        .bindTooltip(lieu.nom);

      groupes[lieu.categorie].addLayer(lieu.marqueur);
    });

    // 3. Les deux groupes sont ajoutés : l'onglet décidera de ce qui reste
    groupes.ville.addTo(map);
    groupes.site.addTo(map);

    // 4. État de l'interface
    const etat = {
      villes: villes,
      sites: sites,
      groupes: groupes,
      onglet: "ville",
      recherche: "",
      liste: document.querySelector("#liste"),
    };

    document.querySelector("#compte-villes").textContent = villes.length;
    document.querySelector("#compte-sites").textContent = sites.length;

    // 5. Les écouteurs d'événements
    document
      .querySelector("#onglet-villes")
      .addEventListener("click", () => activerOnglet(etat, "ville"));

    document
      .querySelector("#onglet-sites")
      .addEventListener("click", () => activerOnglet(etat, "site"));

    document.querySelector("#recherche").addEventListener("input", (evenement) => {
      etat.recherche = evenement.target.value;
      // Le bouton ☰ ouvre et referme le panneau sur mobile
    document
      .querySelector("#bouton-panneau")
      .addEventListener("click", () => {
        document.body.classList.toggle("panneau-ouvert");
      });

    afficherListe(etat);
    });

    afficherListe(etat);

    console.log(
      `${villes.length} ville(s) et ${sites.length} site(s) ajoutés à la carte.`,
    );
  })

  .catch((error) => {
    console.error("Erreur :", error);
  });
