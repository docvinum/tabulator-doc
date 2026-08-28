<script setup>
import { ref, reactive, onMounted } from "vue";
import DataTable from "./components/DataTable.vue";
import { API_BASE } from "./lib/constants.js";
import { fetchJSON, distinctFromList, distinctFromApi } from "./lib/api.js";
import { setupRangeClipboard } from "./lib/rangeClipboard.js";

const activeTab = ref("json");
const tables = {};

const jsonData = ref([]);
const jsonDistinct = reactive({});
const apiData = ref([]);
const apiDistinct = reactive({});
const sqliteDistinct = reactive({});
const ready = reactive({ json: false, api: false, sqlite: false });

const apiBaseUrl = `${API_BASE}/api/employees-api`;
const sqliteUrl = `${API_BASE}/api/employees`;

function registerTable(key, table) {
  tables[key] = table;
}

async function loadJson() {
  const data = await fetchJSON("/data/employees.json");
  jsonData.value = data;
  Object.assign(jsonDistinct, {
    department: distinctFromList(data, "department"),
    city: distinctFromList(data, "city"),
    country: distinctFromList(data, "country"),
    status: distinctFromList(data, "status"),
  });
  ready.json = true;
}

async function loadApi() {
  const [data, department, city, country, status] = await Promise.all([
    fetchJSON(apiBaseUrl),
    distinctFromApi(apiBaseUrl, "department"),
    distinctFromApi(apiBaseUrl, "city"),
    distinctFromApi(apiBaseUrl, "country"),
    distinctFromApi(apiBaseUrl, "status"),
  ]);
  apiData.value = data;
  Object.assign(apiDistinct, { department, city, country, status });
  ready.api = true;
}

async function loadSqliteDistinct() {
  const [department, city, country, status] = await Promise.all([
    distinctFromApi(sqliteUrl, "department"),
    distinctFromApi(sqliteUrl, "city"),
    distinctFromApi(sqliteUrl, "country"),
    distinctFromApi(sqliteUrl, "status"),
  ]);
  Object.assign(sqliteDistinct, { department, city, country, status });
  ready.sqlite = true;
}

onMounted(() => {
  setupRangeClipboard(() => tables[activeTab.value]);
  Promise.all([loadJson(), loadApi(), loadSqliteDistinct()]).catch((err) => {
    console.error(err);
  });
});
</script>

<template>
  <header class="app-header">
    <h1>Demo Tabulator &mdash; Vue 3</h1>
    <p>Trois sources de donnees, un composant DataTable reutilisable.</p>
  </header>

  <nav class="tabs">
    <button :class="['tab-btn', { active: activeTab === 'json' }]" @click="activeTab = 'json'">1. JSON local</button>
    <button :class="['tab-btn', { active: activeTab === 'api' }]" @click="activeTab = 'api'">2. API endpoint</button>
    <button :class="['tab-btn', { active: activeTab === 'sqlite' }]" @click="activeTab = 'sqlite'">3. SQLite (gros volume, serveur)</button>
  </nav>

  <main>
    <section v-show="activeTab === 'json'">
      <DataTable
        v-if="ready.json"
        mode="local"
        :initial-data="jsonData"
        :distinct="jsonDistinct"
        source-label="JSON locale"
        @ready="(t) => registerTable('json', t)"
      >
        <template #note>
          Source : fichier <code>public/data/employees.json</code> charge directement par le navigateur (pas d'appel
          backend). Tri/recherche/filtres cote client. Editions locales uniquement (pas de persistance pour une
          source JSON statique).
        </template>
      </DataTable>
    </section>

    <section v-show="activeTab === 'api'">
      <DataTable
        v-if="ready.api"
        mode="local"
        :initial-data="apiData"
        :base-url="apiBaseUrl"
        :distinct="apiDistinct"
        source-label="API"
        @ready="(t) => registerTable('api', t)"
      >
        <template #note>
          Source : <code>GET/PATCH /api/employees-api</code> (jeu de donnees en memoire cote serveur, 200 lignes).
          Lecture et ecriture passent par l'API ; tri/recherche/filtres restent cote client.
        </template>
      </DataTable>
    </section>

    <section v-show="activeTab === 'sqlite'">
      <DataTable
        v-if="ready.sqlite"
        mode="remote"
        :ajax-url="sqliteUrl"
        :base-url="sqliteUrl"
        :distinct="sqliteDistinct"
        source-label="SQLite"
        @ready="(t) => registerTable('sqlite', t)"
      >
        <template #note>
          Source : <code>GET/PATCH /api/employees</code> (table SQLite, 5000 lignes). Tri, filtres, recherche globale
          et pagination sont evalues cote serveur.
        </template>
      </DataTable>
    </section>
  </main>

  <div id="toast" class="toast"></div>
</template>

<style>
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #f7f8fa;
  color: #1f2430;
  font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.app-header { padding: 24px 32px 8px; }
.app-header h1 { margin: 0 0 4px; font-size: 22px; }
.app-header p { margin: 0; color: #6b7280; }
.tabs { display: flex; gap: 4px; padding: 0 32px; border-bottom: 1px solid #d9dde3; }
.tab-btn {
  border: none; background: none; padding: 10px 16px; font-size: 14px;
  cursor: pointer; color: #6b7280; border-bottom: 2px solid transparent;
}
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 600; }
main { padding: 20px 32px 40px; }

.cell-flash-pending { background: #fef9c3 !important; }
.cell-flash-success { animation: flashSuccess 1.1s ease-out; }
.cell-flash-error { animation: flashError 1.1s ease-out; }
.cell-flash-local { animation: flashLocal 1.1s ease-out; }
@keyframes flashSuccess { 0% { background: #bbf7d0; } 100% { background: transparent; } }
@keyframes flashError { 0% { background: #fecaca; } 100% { background: transparent; } }
@keyframes flashLocal { 0% { background: #e0e7ff; } 100% { background: transparent; } }

.toast {
  position: fixed; bottom: 20px; right: 20px; padding: 10px 16px; border-radius: 8px;
  font-size: 13px; color: white; background: #374151; opacity: 0; transform: translateY(8px);
  pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; max-width: 360px; z-index: 100;
}
.toast.visible { opacity: 1; transform: translateY(0); }
.toast-success { background: #16a34a; }
.toast-error { background: #dc2626; }
.toast-info { background: #374151; }
</style>
