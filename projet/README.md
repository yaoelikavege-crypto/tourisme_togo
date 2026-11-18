# Tourisme Togo

**Le Togo, une terre de découvertes.**
Plateforme de découverte, d'exploration et de valorisation du patrimoine touristique togolais.

---

## 1. Ce que contient la plateforme

Huit pages, une carte interactive et les données réelles du projet
(**24 villes**, **27 sites touristiques**, **5 régions**).

| Page | Route | Contenu |
|---|---|---|
| Accueil | `#/` | Hero photographique, recherche, destinations en vedette, 5 régions, atouts du pays |
| Explorer | `#/explorer` | Carte Leaflet plein écran + recherche + filtres (région, catégorie, type) + liste synchronisée |
| Régions | `#/regions` | Vue des 5 régions |
| Une région | `#/region/Maritime` | Présentation, villes et sites de la région |
| Destinations | `#/destinations` | Catalogue filtrable, tri, pagination |
| Fiche | `#/destination/site/11` | Grande photo, description, coordonnées GPS, mini-carte, itinéraire, partage, lieux à proximité |
| Circuits | `#/circuits` | 3 itinéraires calculés sur les coordonnées réelles, distances à vol d'oiseau, tracés sur carte |
| Culture | `#/culture` | Patrimoine, mémoire, gastronomie, sites patrimoniaux |
| À propos | `#/a-propos` | Mission, chiffres de la base, formulaire de contact validé |

---

## 2. Installation et lancement

Prérequis : **Node.js 20 ou supérieur**.

```bash
cd projet
npm install
npm run dev
```

Puis ouvrir <http://localhost:5173>.

Autres commandes :

```bash
npm run build      # production dans dist/
npm run preview    # prévisualiser le build
```

### Déploiement

Le build utilise des chemins relatifs (`base: "./"`) : le dossier `dist/` peut être
servi depuis n'importe quel hébergement statique (GitHub Pages, Netlify, Vercel),
y compris dans un sous-dossier.

⚠️ Les dossiers `data/` et `assets/` ne sont **pas** copiés par le build : ils sont
lus à l'exécution par `fetch()`. Pour déployer, publier `dist/` **avec** `data/` et
`assets/` à côté (ou ajouter une étape de copie).

---

## 3. Architecture

```
projet/
├── index.html                  page hôte unique
├── package.json  vite.config.js
├── data/                       DONNÉES — ne pas modifier sans le mainteneur
│   ├── villes.json             24 villes
│   ├── sites.json              27 sites
│   ├── togo.geojson            frontière nationale
│   └── togo_regions.geojson    5 régions ADM1
├── assets/images/sites/        31 photographies référencées
└── src/
    ├── main.js                 routeur, navigation, cycle de vie des pages
    ├── store.js                chargement des JSON, helpers, visuel de repli, états
    ├── styles/main.css         design system complet (1 fichier)
    ├── composants/pied.js      carte de destination, en-tête de section, pied de page
    └── pages/                  8 modules, un par page
```

**Choix technique : Vite + JavaScript vanilla**, sans framework. Le routeur par hash
(`#/route`) évite toute configuration serveur. Chaque page exporte une fonction qui
reçoit `{ conteneur, donnees, parametre, chemin }` et retourne une fonction de
nettoyage (`map.remove()`) pour libérer les cartes Leaflet.

---

## 4. Design system

| Élément | Valeur |
|---|---|
| Vert forêt (principal) | `#14532D` |
| Vert nature (boutons) | `#166534` |
| Or (accents) | `#D9A441` |
| Ivoire (fonds) | `#FAFAF5` |
| Anthracite (texte) | `#1F2937` |
| Titres | Poppins 600/700 |
| Texte | Inter 400/500 |
| Coordonnées GPS | JetBrains Mono |

Les couleurs sont déclarées en variables CSS dans `:root` (`src/styles/main.css`).

Principes appliqués : coins arrondis (`--rayon`), ombres discrètes, espacements
généreux, hiérarchie typographique, animations réduites si `prefers-reduced-motion`,
contraste vérifié sur les textes, cibles tactiles ≥ 40 px sur mobile.

---

## 5. Données et règles respectées

Les fichiers `data/*.json` sont la **source de vérité**. Aucun identifiant, aucune
coordonnée et aucune région n'a été modifié.

- Structure conservée : `id, nom, categorie, type, region, latitude, longitude, description, image`
- `latitude` / `longitude` restent des champs distincts ; Leaflet reçoit `[latitude, longitude]`
- Six images référencées sont absentes du dossier `assets/` : la plateforme affiche
  alors un **visuel de remplacement** (dégradé + initiale) au lieu d'une image cassée,
  via `onerror`
- Aucun chiffre, aucune statistique de fréquentation et aucune description factuelle
  n'a été inventé
- Les distances des circuits sont explicitement présentées comme **à vol d'oiseau**

---

## 6. Tests effectués

Environnement de développement : build de production validé, serveur dev opérationnel,
accès aux données et aux images vérifié (HTTP 200).

Tests automatisés exécutés (Node + jsdom, avec Leaflet simulé) :

- **Rendu des 12 vues** (dont 404 destination inconnue) : aucune valeur `undefined`,
  `NaN` ni `[object Object]` dans le HTML produit
- **Routage des 10 chemins** : navigation active, pied de page, titres de page,
  dont `/destination/site/11` → « Koutammakou — Tourisme Togo »
- **Helpers** : normalisation des accents, tri français (Aného avant Anié),
  étiquettes de type, échappement HTML, liens d'itinéraire
- **Géographie** : distance Kpalimé → Womé = 10,4 km ; toutes les coordonnées dans
  les bornes du Togo ; aucun doublon `catégorie + id`

**Non testé dans cet environnement** : rendu visuel réel et interactions tactiles
(aucun navigateur disponible). À vérifier manuellement sur desktop et mobile —
voir la liste ci-dessous.

### À vérifier manuellement

1. Affichage de la carte sur mobile (panneau coulissant, zoom tactile)
2. Position exacte des marqueurs par rapport au fond OpenStreetMap
3. Comportement du regroupement de marqueurs au zoom
4. Contraste et lisibilité des polices chargées depuis Google Fonts
5. Performance avec les images actuelles (7,5 Mo au total)

---

## 7. Fonctionnalités restant à implémenter

- **Backend** : le formulaire de contact ouvre un e-mail prérempli (`mailto:`).
  Aucun serveur, aucune base de données — Supabase/PostgreSQL n'est pas intégré.
- **Galerie photographique** sur la fiche destination : une seule image par lieu
  aujourd'hui, il faudrait un champ `galerie: []`.
- **Circuits personnalisés** : l'utilisateur ne peut pas encore composer son propre
  itinéraire (les 3 circuits sont éditoriaux).
- **Itinéraire routier réel** : le bouton ouvre Google Maps avec les coordonnées,
  les distances affichées sont à vol d'oiseau.
- **Recherche globale** dans la barre de navigation.
- **Internationalisation** (français uniquement).
- **Optimisation des images** : redimensionnement à 1200 px et compression.
- **Corrections de données attendues** : 20 sites partagent la photo de Tsévié,
  et 6 images référencées sont absentes.

---

## 8. Accessibilité et performance

- Lien d'évitement « Aller au contenu »
- `aria-label`, `aria-current`, `role="status"` et `role="alert"` sur les zones dynamiques
- Navigation clavier, `:focus-visible` visible sur tous les éléments interactifs
- `alt` sur toutes les images, `loading="lazy"` et `decoding="async"`
- `prefers-reduced-motion` respecté
- Bundle : 234 Ko de JS et 35 Ko de CSS (67 Ko + 7,5 Ko gzip)

---

## 9. Licence et crédits

Code sous licence MIT (voir `../LICENSE`).

- Fond de carte : © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL)
- Contours administratifs : geo-countries / Natural Earth (ODC-PDDL)
- Bibliothèques : Leaflet 1.9.4, Leaflet.markercluster 1.5.3
- Photographies : contributeurs du projet
