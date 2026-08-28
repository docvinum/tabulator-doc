<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { buildColumns } from "../lib/columns.js";
import { attachPersistence } from "../lib/persistence.js";
import { SEARCHABLE_FIELDS } from "../lib/constants.js";

const props = defineProps({
  mode: { type: String, default: "local" }, // "local" | "remote"
  initialData: { type: Array, default: () => [] },
  ajaxUrl: { type: String, default: null },
  baseUrl: { type: String, default: null }, // null => edits stay local only (pas de persistance)
  distinct: { type: Object, default: () => ({}) },
  sourceLabel: { type: String, default: "" },
});

const emit = defineEmits(["ready"]);

const tableEl = ref(null);
const searchTerm = ref("");
const showColMenu = ref(false);
const columnsMeta = reactive([]);

let table = null;

function toggleColumn(field) {
  const col = table.getColumn(field);
  col.toggle();
  const meta = columnsMeta.find((c) => c.field === field);
  if (meta) meta.visible = col.isVisible();
}

function onSearchInput() {
  const term = searchTerm.value.trim().toLowerCase();
  if (props.mode === "remote") {
    table.setPage(1); // ajaxParams() relit searchTerm.value au prochain fetch
  } else if (!term) {
    table.clearFilter();
  } else {
    table.setFilter((data) =>
      SEARCHABLE_FIELDS.some((f) => String(data[f] ?? "").toLowerCase().includes(term))
    );
  }
}

onMounted(() => {
  const commonOptions = {
    layout: "fitDataFill",
    height: "560px",
    movableColumns: true,
    // "dblclick" (plutot que le defaut "focus") evite qu'un glisser-selection de plage
    // (SelectRange) ouvre accidentellement l'editeur sur la cellule de depart. L'edition
    // reste possible via double-clic ou via Entree (SelectRange appelle editCell() directement).
    editTriggerEvent: "dblclick",
    selectableRange: true,
    selectableRangeColumns: true,
    selectableRangeClearCells: true,
    columns: buildColumns(props.distinct, { editable: true }),
  };

  if (props.mode === "remote") {
    table = new Tabulator(tableEl.value, {
      ...commonOptions,
      ajaxURL: props.ajaxUrl,
      ajaxParams: () => ({ q: searchTerm.value.trim() }),
      pagination: true,
      paginationMode: "remote",
      sortMode: "remote",
      filterMode: "remote",
      paginationSize: 50,
      paginationSizeSelector: [25, 50, 100, 200],
    });
  } else {
    table = new Tabulator(tableEl.value, {
      ...commonOptions,
      data: props.initialData,
      reactiveData: false,
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 25, 50, true],
    });
  }

  table.on("tableBuilt", () => {
    columnsMeta.splice(0, columnsMeta.length, ...table.getColumns()
      .filter((c) => c.getField())
      .map((c) => ({ field: c.getField(), title: c.getDefinition().title, visible: c.isVisible() })));
  });

  attachPersistence(table, { baseUrl: props.baseUrl, sourceLabel: props.sourceLabel });
  emit("ready", table);
});

onBeforeUnmount(() => {
  if (table) table.destroy();
});
</script>

<template>
  <div class="datatable">
    <p class="source-note"><slot name="note" /></p>
    <div class="toolbar">
      <input
        v-model="searchTerm"
        type="search"
        class="global-search"
        :placeholder="mode === 'remote' ? 'Recherche globale (serveur)...' : 'Recherche globale...'"
        @input="onSearchInput"
      />
      <button class="col-vis-btn" @click="showColMenu = !showColMenu">Colonnes</button>
      <div v-if="showColMenu" class="col-vis-menu">
        <label v-for="col in columnsMeta" :key="col.field">
          <input type="checkbox" :checked="col.visible" @change="toggleColumn(col.field)" />
          {{ col.title }}
        </label>
      </div>
    </div>
    <div ref="tableEl"></div>
  </div>
</template>

<style scoped>
.source-note {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #3730a3;
  margin: 0 0 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  position: relative;
}
.global-search {
  flex: 0 0 280px;
  padding: 7px 10px;
  border: 1px solid #d9dde3;
  border-radius: 6px;
  font-size: 13px;
}
.col-vis-btn {
  padding: 7px 12px;
  border: 1px solid #d9dde3;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.col-vis-btn:hover { background: #f1f3f5; }
.col-vis-menu {
  position: absolute;
  top: 38px;
  right: 0;
  background: #fff;
  border: 1px solid #d9dde3;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}
.col-vis-menu label {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
</style>
