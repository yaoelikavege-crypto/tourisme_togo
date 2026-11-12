# 🗺️ Togo Tourisme — Carte interactive

Carte interactive du Togo pour découvrir ses régions et ses sites touristiques.
Le projet est une application **100 % statique** (HTML / CSS / JavaScript) qui s'appuie sur
[Leaflet](https://leafletjs.com/) et des données géographiques **GeoJSON**.

![Statut](https://img.shields.io/badge/statut-prototype-orange)
![Licence](https://img.shields.io/badge/licence-MIT-blue)
![Sans dépendances](https://img.shields.io/badge/d%C3%A9pendances-aucune-brightgreen)

---

## ✨ Fonctionnalités

- **Fond de carte** OpenStreetMap via Leaflet 1.9.4 (CDN, aucune installation).
- **Les 5 régions administratives** du Togo dessinées et colorées selon une palette touristique :

  | Code ISO | Région | Couleur |
  |---|---|---|
  | `TG-S` | Savanes | Ocre doré `#D99A22` |
  | `TG-K` | Kara | Rouge latérite `#C44936` |
  | `TG-C` | Centrale | Vert olive `#8A9B32` |
  | `TG-P` | Plateaux | Vert forêt `#176B45` |
  | `TG-M` | Maritime | Bleu océan `#168AAD` |

- **Frontière nationale** du Togo tracée par-dessus les régions, avec cadrage automatique
  (`fitBounds`) sur le territoire.
- **Infobulles et popups** au survol / clic sur chaque région.
- **Marqueurs des villes** chargés dynamiquement depuis `data/destinations.json`
  (nom, description, région).
- **Fiches cliquables** : photo, catégorie, région et description pour chaque lieu.
- **Repli robuste** : vérification des réponses HTTP et messages d'erreur en console.

---

## 🚀 Lancer le projet en local

L'application charge des fichiers `.json` / `.geojson` par `fetch()` : **ouvrir `index.html`
directement par double-clic ne fonctionne pas** (restrictions `file://` du navigateur).
Il faut un petit serveur local.

```bash
# Depuis le dossier du projet
cd projet

# Python 3 (déjà installé sur Linux / macOS)
python3 -m http.server 8000

# ou avec Node.js
npx serve .
```

Puis ouvrir <http://localhost:8000> dans le navigateur.

> ⚠️ **Règle — la casse des noms de fichiers compte.**
> Sous Linux et sur GitHub Pages, `CSS/style.css` et `css/style.css` sont deux fichiers
> différents. Tous les dossiers du projet sont en minuscules (`css/`, `js/`, `data/`,
> `assets/`). Windows masque ce piège : ne vous y fiez pas.

---

## 📁 Structure du projet

```
tourisme_togo/
├── README.md
├── LICENSE
├── .gitignore
└── projet/                         ← application
    ├── index.html                   page unique (carte plein écran)
    ├── css/style.css                styles de la page, du conteneur #map et des fiches
    ├── js/app.js                    initialisation Leaflet + chargement des GeoJSON
    ├── data/
    │   ├── destinations.json        sites et villes à afficher (nom, coordonnées, description)
    │   ├── togo.geojson             frontière nationale du Togo (Feature / Polygon)
    │   └── togo_regions.geojson     les 5 régions ADM1 (FeatureCollection)
    └── assets/images/sites/         photos des sites touristiques
```

### Ajouter un site touristique

Il suffit d'éditer `data/destinations.json` :

```json
{
  "id": 3,
  "nom": "Cascade de Womé",
  "categorie": "site",
  "region": "Plateaux",
  "latitude": 6.9333,
  "longitude": 0.5833,
  "description": "Cascade enchâssée dans la forêt, près de Kpalimé.",
  "image": "assets/images/sites/cascade_wome.jpg"
}
```

> ℹ️ Seules les entrées dont `categorie` vaut `"ville"` affichent actuellement un marqueur
> (voir `js/app.js`). Étendre ce filtre permet d'afficher aussi les sites naturels.

---

## 🗃️ Sources des données

| Donnée | Source | Licence |
|---|---|---|
| Frontière nationale (`togo.geojson`) | [geo-countries](https://github.com/datasets/geo-countries) — Natural Earth | **ODC-PDDL 1.0** (domaine public) |
| Régions ADM1 (`togo_regions.geojson`) | dérivé de geo-countries (ADM1) / GADM / OCHA | ODC-PDDL 1.0 (attribution : Natural Earth, Lexman, OKFN) |
| Fond de carte | [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | **ODbL** |
| Bibliothèque de cartographie | [Leaflet](https://leafletjs.com/) 1.9.4 | BSD-2-Clause |

**Attribution obligatoire** affichée sur la carte pour OpenStreetMap. Les jeux de données
GADM utilisés pour dériver les régions sont soumis à leurs propres conditions
(usage non commercial) : ne pas les redistribuer sans vérifier leur licence.

---

## 🧭 Pistes d'amélioration

- [ ] Filtres par catégorie (villes, sites naturels, patrimoine) et par région.
- [ ] Fiches descriptives détaillées par site (photo, accès, tarifs).
- [ ] Regroupement des marqueurs (`L.markerClusterGroup`) quand la liste s'étoffe.
- [ ] Adaptation mobile (panneau coulissant, carte plein écran).
- [ ] Factoriser les deux blocs `fetch()` de `app.js` en `async/await`.
- [ ] Échapper les chaînes injectées dans les popups (si les données deviennent externes).
- [ ] Déploiement automatique sur **GitHub Pages**.

---

## 🤝 Contribution

Les contributions sont bienvenues : ouvrez une *issue* pour signaler un bug ou proposer un
site à ajouter, puis une *pull request* sur une branche dédiée.

Convention de commit suggérée : [Conventional Commits](https://www.conventionalcommits.org/fr/)
(`feat:`, `fix:`, `docs:`, `style:`, `refactor:`).

---

## 📄 Licence

Code distribué sous **licence MIT** — voir [LICENSE](LICENSE).
Les données géographiques conservent leurs licences d'origine (voir ci-dessus).

---

*Projet Togo Tourisme — cartographie au service de la découverte du Togo.*
