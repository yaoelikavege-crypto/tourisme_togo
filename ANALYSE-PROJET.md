# Analyse de l'état du projet — `tourisme_togo`

**Date de l'analyse :** 12 novembre 2026
**Branche analysée :** `arena/e1586a13-tourisme-togo` (identique à `main`, commit `1e55c8a`)
**Dépôt :** github.com/yaoelikavege-crypto/tourisme_togo — *« Carte interactive du Togo pour le projet Togo Tourisme »*

---

## 1. Vue d'ensemble

| Élément | État |
|---|---|
| Commits | **1 seul** (`Etat du code au 12 nov 2026 a 18h24`) |
| Fichiers versionnés | 21 |
| Lignes de code écrites (HTML/CSS/JS) | ~182 lignes utiles |
| Langages | HTML, CSS, JavaScript (Leaflet 1.9.4 via CDN), GeoJSON |
| Outillage | **aucun** : pas de `package.json`, pas de bundler, pas de linter, pas de tests, pas de CI |
| Documentation | **aucune** (pas de README, pas de licence à la racine) |
| Déploiement | aucun (pas de GitHub Pages, pas de config d'hébergement) |
| Issues / PR | 0 / 0 |
| Taille du dépôt | `.git` ≈ 9,3 Mo — arbre de travail ≈ 20 Mo |

Le projet est un **prototype statique très jeune** (dépôt créé le 12/11/2026) : une page unique
affichant une carte Leaflet du Togo avec les 5 régions administratives colorées, les frontières
nationales et (en théorie) des marqueurs de villes.

### Structure actuelle

```
tourisme_togo/
└── Desktop/Touruisme-Togo/          ← projet enterré 2 niveaux + faute de frappe
    ├── index.html                   (33 l.)
    ├── CSS/style.css                (15 l.)   ← majuscule "CSS"
    ├── js/app.js                    (134 l.)
    ├── data/
    │   ├── destination.json         (2 villes, image: null)
    │   ├── togo.geojson             (frontière nationale, 12 Ko)
    │   └── togo_regions.geojson     (5 régions ADM1, 76 Ko)
    ├── assets/images/sites/cascade_wome.jpg   (120 Ko, jamais utilisé)
    ├── .vscode/settings.json        (ignoreLimitWarning: true)
    └── GitHubcollect/               ← ~20 Mo de données brutes téléchargées
        ├── geo-countries-main.zip                     (4,6 Mo)
        ├── geo-countries-main/…/data/countries.geojson (14,6 Mo)
        └── geo-region/*.geojson    (4 variantes des régions du Togo)
```

---

## 2. Bugs bloquants (l'application ne fonctionne pas correctement)

### 🔴 B1 — La feuille de style n'est jamais chargée (carte invisible)
`index.html` ligne 14 : `href="css/style.css"` alors que le dossier s'appelle **`CSS/`**.
Testé sur un serveur statique : `/css/style.css` → **404**, `/CSS/style.css` → 200.
Conséquence : `#map` n'a pas de hauteur → la carte Leaflet s'affiche avec **0 px de haut**.
C'est le bug le plus grave : sans lui, le reste ne se voit pas.

> Correctif : `href="CSS/style.css"` (ou mieux : renommer le dossier en `css/`, `js/`, `assets/`
> — tout en minuscules, convention web).

### 🔴 B2 — Le fichier des destinations n'existe pas
`js/app.js` ligne 104 lance `fetch("data/destinations.json")` (au **pluriel**),
alors que le fichier versionné est `data/destination.json` (au **singulier**) → **404**.
Conséquence : `throw new Error("Impossible de charger les destinations")`, aucun marqueur de ville
n'est créé, et seules 2 erreurs apparaissent en console.

> Correctif : renommer le fichier en `destinations.json` (plus cohérent avec le nom de variable).

### 🟠 B3 — `maxZoom: 60` sur le fond OpenStreetMap
`js/app.js` ligne 15. OSM ne sert des tuiles que jusqu'au zoom **19**. Au-delà, Leaflet
demande des tuiles inexistantes → **404 en rafale** et fond de carte gris/blanc dès qu'on zoome
ou qu'un double-clic est fait.

> Correctif : `maxZoom: 19` (et `maxNativeZoom: 19`).

### 🟡 B4 — Gestion d'erreur invisible pour l'utilisateur
Toutes les erreurs partent dans `console.error`. Pour un utilisateur final : écran vide, sans
explication. Prévoir un message dans la page (ex. un `div` d'alerte).

---

## 3. Qualité du code

**Points positifs**
- Séparation HTML / CSS / JS claire, code commenté par étapes, indenté, lisible.
- Vérification des `response.ok` avant parsing : bonne pratique.
- Palette de couleurs par région (`couleursRegions`) : intention soignée, avec repli `#64748B`.
- Chargement des deux GeoJSON en `Promise.all` : correct et efficace.

**Points à améliorer**
- **Duplication** : deux blocs `fetch().then().catch()` presque identiques (lignes 32-102 et 104-134)
  → factoriser dans une fonction `chargerJSON(url)` ou passer en `async/await`.
- **Ordre d'exécution fragile** : les marqueurs ne sont pas dans un `L.layerGroup` ajouté après
  `fitBounds` ; la carte bouge après coup. Un seul flux séquentiel serait plus sûr.
- **Injection HTML** : `layer.bindPopup(\`... ${ville.nom} ...\`)` insère directement les chaînes
  du JSON dans le DOM. Sans risque avec vos propres données, mais à échapper si les données
  deviennent externes ou saisies par des utilisateurs.
- **Code mort / inutilisé** : `assets/images/sites/cascade_wome.jpg` n'est référencé nulle part
  (le champ `image` vaut `null` pour les 2 destinations) ; `console.log` de debug laissés en prod.
- **Pas de `"use strict"`/module ES** : envisager `<script type="module">` pour isoler le scope.
- **Accessibilité / SEO** : pas de `<meta name="description">`, pas de favicon, pas de `<main>`,
  `#map` sans attribut `aria-label`. Titre H1 unique : bien.
- **Pas de mode hors-ligne** ni de repli si unpkg/OSM est indisponible (CDN en dépendance directe).

---

## 4. Données & dépôt Git

### 4.1 Poids mort important (~20 Mo, soit > 95 % du contenu)
- `GitHubcollect/geo-countries-main.zip` (4,6 Mo) : **archive en doublon** de
  `GitHubcollect/geo-countries-main/…`, elle-même déjà extraite.
- `…/data/countries.geojson` (14,6 Mo) : géométries **du monde entier** — le projet n'utilise
  que le Togo. Fichier inutile et lourd dans l'historique Git pour toujours.
- `GitHubcollect/geo-region/` : **4 variantes** des régions du Togo (GADM, OCHA, détaillée 508 Ko,
  simplifiée 76 Ko). Seule la simplifiée est utilisée… et elle est **strictement identique**
  (même MD5) à `data/togo_regions.geojson` : doublon octet pour octet.
- `.vscode/settings.json` ne contient que `"git.ignoreLimitWarning": true` : c'est un pansement
  sur le symptôme (fichiers trop gros) plutôt qu'un `.gitignore`. À retirer.

### 4.2 Absence de `.gitignore`
Aucun `.gitignore` : les archives, données brutes et fichiers d'éditeur sont versionnés.
Recommandation : garder **uniquement** les GeoJSON réellement servis (`data/`), déplacer les
sources dans un dossier exclu ou un stockage externe (release GitHub, Git LFS, Drive).

### 4.3 Arborescence
Le projet est rangé dans `Desktop/Touruisme-Togo/` :
- « **Desktop** » n'a aucun sens dans un dépôt (reliquat de copier-coller local) ;
- « **Touruisme** » est une faute de frappe (le dépôt s'appelle `tourisme_togo`) ;
- cette profondeur casse un éventuel **GitHub Pages** (il faudrait publier depuis
  `/Desktop/Touruisme-Togo`, ce qui est possible mais contre-intuitif).

Recommandation : remonter `index.html`, `css/`, `js/`, `data/`, `assets/` à la racine du dépôt.

### 4.4 Historique Git
- **Un seul commit initial** : « État du code au 12 nov 2026 à 18h24 ». Ce n'est pas un message
  de commit décrivant un changement — l'historique ne racontera rien. À l'avenir : commits
  atomiques en mode impératif (`feat: ajoute les marqueurs de villes`, `fix: corrige le chemin CSS`).
- Aucun tag, aucune branche de travail, aucune protection de branche, pas de description des
  changements (`CHANGELOG`).

### 4.5 Licences & attribution
- Le code du projet n'a **pas de licence** → par défaut « tous droits réservés », ce qui empêche
  la réutilisation alors qu'il s'agit d'un projet ouvert.
- Les données importées sont bien couvertes : `geo-countries` = **ODC-PDDL 1.0** (domaine public,
  Natural Earth / Lexman / OKFN) avec `ATTRIBUTION.txt` présent — à conserver. Les fichiers
  GADM/OCHA ont leurs propres conditions (GADM : usage non commercial) : à documenter si publiés.

### 4.6 Contenu sensible / hygiène
Aucun secret, aucune clé d'API, aucun fichier de configuration privé dans le dépôt : ✅ propre.
Dépendances chargées en CDN (unpkg, OSM) : pas de `node_modules`, donc rien à auditer pour l'instant.

---

## 5. Ce qui manque pour un projet « présentable »

| Priorité | Action |
|---|---|
| 1 | Corriger B1 (chemin CSS), B2 (nom du fichier JSON), B3 (`maxZoom`) |
| 2 | Ajouter un `README.md` : objectif, capture d'écran, lancement local (`python3 -m http.server`), sources des données |
| 3 | Ajouter un `LICENSE` (MIT par ex.) et un `ATTRIBUTION.md` pour les données |
| 4 | Nettoyer les ~20 Mo inutiles + `.gitignore` (données brutes, `.vscode/`, `.DS_Store`) |
| 5 | Aplatir l'arborescence à la racine, renommer `CSS` → `css` |
| 6 | Activer GitHub Pages (branche `main`, dossier racine) pour avoir une URL publique |
| 7 | Compléter `destinations.json` (5–10 sites : Koutammakou, Cascade de Womé, Agbodrafo, Aného, Fazao-Malfakassa…), valoriser l'image déjà présente |
| 8 | Suite : filtres par catégorie/région, fiche descriptive par site, responsive mobile, tests légers |

---

## 6. Conclusion

Le socle technique est **sain et bien intentionné** : Leaflet + GeoJSON est le bon choix pour une
carte touristique, les données géographiques sont réelles et correctes (5 régions ADM1 avec codes
ISO `TG-S`…`TG-M` parfaitement mappés à la palette), et le code est lisible.

Mais en l'état, **l'application ne s'affiche pas correctement** : une faute de casse dans un
chemin CSS (`CSS` vs `css`) suffit à rendre la carte invisible, et un nom de fichier au pluriel
empêche l'affichage des villes. Le dépôt est par ailleurs **alourdi de ~20 Mo de données brutes
inutilisées** et dépourvu de la documentation minimale (README, licence, `.gitignore`).

**Verdict : prototype prometteur (~30 % d'avancement), à consolider en priorité sur les 3 bugs
bloquants, puis sur l'hygiène du dépôt.** Les correctifs des bugs B1–B3 représentent moins de
5 minutes de travail pour un gain fonctionnel immédiat.
