# Demo Tabulator — 3 sources de donnees, 2 frontends

Demo complete de [Tabulator](https://tabulator.info/) illustrant la lecture/ecriture de donnees
depuis 3 sources differentes, avec toutes les fonctionnalites d'un datatable moderne :
tri, recherche (globale + par colonne), filtrage (texte + liste de valeurs distinctes),
reorganisation/masquage/redimensionnement des colonnes, selection de cellules, copier-coller,
edition directe avec validation, persistance via API et gestion d'erreurs, ainsi que le
tri/filtre/recherche/pagination cote serveur pour un gros volume de donnees (5000 lignes).

Deux implementations du meme cahier des charges sont fournies, partageant le meme backend :

- **`demo-vanilla/`** — JavaScript vanilla (sans framework), Tabulator charge via npm.
- **`app-vue/`** — application Vue 3 + Vite, avec un composant `DataTable.vue` reutilisable.

## Architecture

```
backend/         API FastAPI (Python) — source de verite pour 2 des 3 sources de donnees
  app/
    fake_data.py     generation de donnees factices (Faker) : employes
    db.py             SQLite (5000 lignes) — source "gros volume"
    store.py          liste en memoire (200 lignes) — source "API generique"
    schemas.py        validation Pydantic (regles de validation cote serveur)
    query_params.py   parsing des parametres de requete envoyes par Tabulator (mode remote)
    sql_builder.py     construction securisee des clauses WHERE/ORDER BY SQLite
    routers/
      employees_api.py     GET/PATCH /api/employees-api      (source "API", en memoire)
      employees_sqlite.py  GET/PATCH /api/employees           (source "SQLite", gros volume)
  scripts/generate_json_source.py   genere le fichier JSON statique (60 lignes) partage
                                     par les 2 frontends (source "JSON local")

demo-vanilla/     Demo JS vanilla (sert data/employees.json + appelle l'API backend)
app-vue/          Demo Vue 3 + Vite (sert public/data/employees.json + appelle l'API backend)
```

### Les 3 sources de donnees

| Source | Lecture | Ecriture | Tri/Filtre/Recherche | Notes |
|---|---|---|---|---|
| **1. JSON local** | `data/employees.json` charge directement par le navigateur | Locale uniquement (pas de backend) | Cote client (Tabulator) | 60 employes, aucune dependance au backend |
| **2. API endpoint** | `GET /api/employees-api` (backend, liste en memoire) | `PATCH /api/employees-api/{id}` | Cote client (petit volume) | 200 employes, persiste tant que le process backend tourne |
| **3. SQLite (gros volume)** | `GET /api/employees` (backend, table SQLite) | `PATCH /api/employees/{id}` | **Cote serveur** (tri/filtre/recherche/pagination) | 5000 employes, persiste sur disque (`backend/data/app.db`) |

## Demarrage rapide

### 1. Backend (requis pour les sources "API" et "SQLite")

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Au premier demarrage, la table SQLite est creee et peuplee automatiquement (5000 lignes).
Le fichier JSON statique (`data/employees.json`) est deja genere et versionne dans les deux
frontends ; pour le regenerer :

```bash
cd backend && source .venv/bin/activate
python -m scripts.generate_json_source
```

### 2a. Demo JavaScript vanilla

```bash
cd demo-vanilla
npm install
npm start   # sert le dossier sur http://127.0.0.1:5500 (python3 -m http.server)
```

Ouvrir http://127.0.0.1:5500

### 2b. Application Vue 3

```bash
cd app-vue
npm install
npm run dev   # http://127.0.0.1:5173
```

Les deux frontends appellent le backend sur `http://127.0.0.1:8000` (CORS ouvert, `API_BASE`
configurable dans `js/constants.js` / `src/lib/constants.js`).

## Fonctionnalites implementees

- **Lecture** : JSON statique, endpoint API (donnees en memoire), SQLite via le backend.
- **Ecriture/modification via API** : `PATCH` avec validation serveur (Pydantic) — departement,
  statut, salaire (1-500 000), note (1-5), email, date d'embauche (pas dans le futur), etc.
- **Tri des colonnes** : cote client (sources JSON/API) et cote serveur (source SQLite,
  `sort[0][field]`/`sort[0][dir]`, format natif Tabulator).
- **Recherche globale** : champ de recherche par table, cote client (`table.setFilter`) ou
  cote serveur (parametre `q`, recherche sur prenom/nom/email/departement/poste/ville/pays/statut).
- **Recherche/filtre par colonne** : `headerFilter` texte (contient), nombre (`>=`), date (`>=`).
- **Filtrage par liste de valeurs distinctes** : colonnes categorielles (departement, ville, pays,
  statut) avec `headerFilter: "list"` multiselect, valeurs chargees depuis
  `GET /distinct/{field}` (ou calculees cote client pour la source JSON).
- **Glisser-deposer des colonnes**, **masquage/affichage** (menu dedie), **redimensionnement**
  (natifs Tabulator : `movableColumns`, menu colonnes personnalise, `resizableColumns`).
- **Selection de cellules** (module `selectableRange`, Excel-like), **copier** (`Ctrl+C` via
  l'API Clipboard), **coller dans une plage de cellules editables** (`Ctrl+V`, avec repetition
  d'une valeur unique sur toute la plage ou collage ligne/colonne).
- **Edition directe** : double-clic ou selection + `Entree` (le glisser-selection de plage
  n'ouvre pas l'editeur par accident — voir `editTriggerEvent: "dblclick"`).
- **Validation** : cote client (validators Tabulator, retour visuel immediat) **et** cote
  serveur (Pydantic, seule source de verite en cas d'ecart).
- **Persistance + gestion d'erreurs** : chaque edition valide declenche un `PATCH` ; en cas
  d'echec (validation serveur, email deja utilise, etc.), la cellule est restauree
  (`cell.restoreOldValue()`) et un message d'erreur est affiche (toast).
- **Serveur pour gros volume** : la source SQLite (5000 lignes) fonctionne entierement en mode
  `remote` (`paginationMode`, `sortMode`, `filterMode`), aucune donnee n'est chargee en trop.

## Notes techniques

- Tabulator (community/MIT) est installe via npm (`tabulator-tables`) dans les deux projets —
  aucune dependance a un CDN externe.
- Le format des requetes remote (`page`, `size`, `sort[0][field]`, `filter[0][type]`, etc.) suit
  exactement la convention native de Tabulator ; le backend les parse et les traduit en SQL
  parametre (whitelist de colonnes, jamais d'interpolation directe de nom de champ).
- Les modules `columns.js`, `persistence.js`, `rangeClipboard.js`, `constants.js` sont partages
  (quasi identiques) entre la demo vanilla (`demo-vanilla/js/`) et l'app Vue (`app-vue/src/lib/`),
  pour eviter toute divergence de comportement entre les deux implementations.
