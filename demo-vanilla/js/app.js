import { API_BASE } from "./constants.js";
import { buildColumns } from "./columns.js";
import { attachPersistence, showToast } from "./persistence.js";
import { setupRangeClipboard } from "./rangeClipboard.js";

const SEARCHABLE_FIELDS = [
  "first_name", "last_name", "email", "department", "job_title", "city", "country", "status",
];

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
  selectableRange: true,
  selectableRangeColumns: true,
  selectableRangeClearCells: true,
};

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function distinctFrom(list, field) {
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

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    if (key === "sqlite") {
      table.sqliteSearch = term;
      table.setPage(1);
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
    department: await distinctFrom(data, "department"),
    city: await distinctFrom(data, "city"),
    country: await distinctFrom(data, "country"),
    status: await distinctFrom(data, "status"),
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

  // En mode remote, l'echec du chargement ajax ne rejette pas cette fonction :
  // Tabulator le signale via l'evenement dataLoadError. C'est le seul point ou
  // l'absence de backend devient observable pour cette source.
  table.on("dataLoadError", () => revealBackendNote("sqlite"));

  attachPersistence(table, { baseUrl, sourceLabel: "SQLite" });
  tables.sqlite = table;
  wireToolbar("sqlite", table);
}

function revealBackendNote(panelKey) {
  const note = document.querySelector(`#panel-${panelKey} [data-backend-note]`);
  if (note) note.hidden = false;
}

wireThemeToggle();
wireTabs();
setupRangeClipboard(() => tables[activeTabKey]);

// La source JSON est purement cliente : son echec est une vraie erreur.
initJsonTable().catch((err) => {
  console.error(err);
  showToast(`Erreur d'initialisation (JSON local): ${err.message}`, "error");
});

// Les sources API et SQLite dependent du backend Python. Quand il est absent
// (ex. demo hebergee sur GitHub Pages), on affiche le bandeau d'explication
// au lieu d'un toast d'erreur bloquant.
initApiTable().catch((err) => {
  console.error("API table init failed:", err);
  revealBackendNote("api");
});
initSqliteTable().catch((err) => {
  console.error("SQLite table init failed:", err);
  revealBackendNote("sqlite");
});
