import { API_BASE, SEARCHABLE_FIELDS } from "./constants.js";
import { buildColumns } from "./columns.js";
import { attachPersistence, showToast } from "./persistence.js";
import { setupRangeClipboard } from "./rangeClipboard.js";

const REMOTE_SEARCH_DEBOUNCE = 300;

const tables = {};
let activeTabKey = "json";

const COMMON_OPTIONS = {
  layout: "fitDataFill",
  height: "560px",
  movableColumns: true,
  resizableColumnFit: false,
  // "dblclick" (plutot que le defaut "focus") evite qu'un glisser-selection de plage
  // (SelectRange) ouvre accidentellement l'editeur sur la cellule de depart. L'edition
  // reste possible via double-clic ou via Entree (SelectRange appelle editCell() directement).
  editTriggerEvent: "dblclick",
  // Avec selectableRangeColumns, un clic sur l'en-tete sert a la fois au tri et
  // a la selection de colonne : Tabulator avertit en console et le resultat est
  // ambigu. On restreint donc le tri au clic sur l'icone de tri.
  headerSortClickElement: "icon",
  selectableRange: true,
  selectableRangeColumns: true,
  selectableRangeClearCells: true,
};

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

function distinctFrom(list, field) {
  return [...new Set(list.map((r) => r[field]))].sort();
}

async function distinctFromApi(baseUrl, field) {
  try {
    return await fetchJSON(`${baseUrl}/distinct/${field}`);
  } catch (e) {
    console.warn("distinct fetch failed", field, e);
    return [];
  }
}

/**
 * Le backend Python est optionnel (la demo hebergee sur GitHub Pages n'en a pas).
 * On le sonde une seule fois avant de construire les tables "API" et "SQLite" :
 * sans cela, Tabulator tente le chargement ajax et journalise lui-meme
 * "Ajax Load Error" / "Data Load Error" dans la console, en plus des quelque
 * huit appels /distinct qui echouent chacun de leur cote.
 */
async function backendReachable() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function buildColumnVisibilityMenu(table, container) {
  container.innerHTML = "";
  table.getColumns().forEach((col) => {
    const def = col.getDefinition();
    if (!def.field) return;
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = col.isVisible();
    checkbox.addEventListener("change", () => col.toggle());
    label.appendChild(checkbox);
    label.append(" " + def.title);
    container.appendChild(label);
  });
}

function wireToolbar(key, table) {
  const searchInput = document.querySelector(`.global-search[data-target="${key}"]`);
  const visBtn = document.querySelector(`.col-vis-btn[data-target="${key}"]`);
  const visMenu = document.querySelector(`.col-vis-menu[data-target="${key}"]`);

  // En mode serveur, chaque frappe declencherait une requete : on temporise.
  const runRemoteSearch = debounce(() => {
    table.setPage(1).catch(() => {
      /* echec de chargement deja signale par l'evenement dataLoadError */
    });
  }, REMOTE_SEARCH_DEBOUNCE);

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    if (key === "sqlite") {
      table.sqliteSearch = term;
      runRemoteSearch();
    } else if (!term) {
      table.clearFilter();
    } else {
      table.setFilter((data) =>
        SEARCHABLE_FIELDS.some((f) => String(data[f] ?? "").toLowerCase().includes(term))
      );
    }
  });

  visBtn.addEventListener("click", () => {
    visMenu.hidden = !visMenu.hidden;
  });
  document.addEventListener("click", (e) => {
    if (!visMenu.contains(e.target) && e.target !== visBtn) visMenu.hidden = true;
  });

  table.on("tableBuilt", () => buildColumnVisibilityMenu(table, visMenu));
}

function wireThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = document.documentElement.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

function wireTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === key));
      activeTabKey = key;
      if (tables[key]) tables[key].redraw(true);
    });
  });
}

async function initJsonTable() {
  const data = await fetchJSON("data/employees.json");
  const distinct = {
    department: distinctFrom(data, "department"),
    city: distinctFrom(data, "city"),
    country: distinctFrom(data, "country"),
    status: distinctFrom(data, "status"),
  };

  const table = new Tabulator("#table-json", {
    ...COMMON_OPTIONS,
    data,
    reactiveData: false,
    pagination: true,
    paginationSize: 10,
    paginationSizeSelector: [10, 25, 50, true],
    columns: buildColumns(distinct, { editable: true }),
  });

  attachPersistence(table, { sourceLabel: "JSON locale" });
  tables.json = table;
  wireToolbar("json", table);
}

async function initApiTable() {
  const baseUrl = `${API_BASE}/api/employees-api`;
  const [data, department, city, country, status] = await Promise.all([
    fetchJSON(baseUrl),
    distinctFromApi(baseUrl, "department"),
    distinctFromApi(baseUrl, "city"),
    distinctFromApi(baseUrl, "country"),
    distinctFromApi(baseUrl, "status"),
  ]);

  const table = new Tabulator("#table-api", {
    ...COMMON_OPTIONS,
    data,
    reactiveData: false,
    pagination: true,
    paginationSize: 10,
    paginationSizeSelector: [10, 25, 50, true],
    columns: buildColumns({ department, city, country, status }, { editable: true }),
  });

  attachPersistence(table, { baseUrl, sourceLabel: "API" });
  tables.api = table;
  wireToolbar("api", table);
}

async function initSqliteTable() {
  const baseUrl = `${API_BASE}/api/employees`;
  const [department, city, country, status] = await Promise.all([
    distinctFromApi(baseUrl, "department"),
    distinctFromApi(baseUrl, "city"),
    distinctFromApi(baseUrl, "country"),
    distinctFromApi(baseUrl, "status"),
  ]);

  const table = new Tabulator("#table-sqlite", {
    ...COMMON_OPTIONS,
    ajaxURL: baseUrl,
    ajaxParams: () => ({ q: table.sqliteSearch || "" }),
    pagination: true,
    paginationMode: "remote",
    sortMode: "remote",
    filterMode: "remote",
    paginationSize: 50,
    paginationSizeSelector: [25, 50, 100, 200],
    columns: buildColumns({ department, city, country, status }, { editable: true }),
  });
  table.sqliteSearch = "";

  // Le backend a repondu au demarrage mais peut tomber ensuite : en mode remote,
  // l'echec ajax ne rejette pas la construction, Tabulator le signale via cet evenement.
  table.on("dataLoadError", () => revealBackendNote("sqlite"));

  attachPersistence(table, { baseUrl, sourceLabel: "SQLite" });
  tables.sqlite = table;
  wireToolbar("sqlite", table);
}

function revealBackendNote(panelKey) {
  const note = document.querySelector(`#panel-${panelKey} [data-backend-note]`);
  if (note) note.hidden = false;
}

async function main() {
  wireThemeToggle();
  wireTabs();
  setupRangeClipboard(() => tables[activeTabKey]);

  // La source JSON est purement cliente : son echec est une vraie erreur.
  const jsonReady = initJsonTable().catch((err) => {
    console.error(err);
    showToast(`Erreur d'initialisation (JSON local): ${err.message}`, "error");
  });

  if (await backendReachable()) {
    await Promise.all([
      initApiTable().catch((err) => {
        console.warn("API table init failed:", err);
        revealBackendNote("api");
      }),
      initSqliteTable().catch((err) => {
        console.warn("SQLite table init failed:", err);
        revealBackendNote("sqlite");
      }),
    ]);
  } else {
    // Pas de backend (ex. demo hebergee sur GitHub Pages) : on affiche le bandeau
    // d'explication au lieu de laisser les tables echouer bruyamment.
    revealBackendNote("api");
    revealBackendNote("sqlite");
  }

  await jsonReady;
}

main();
