# 10 — Vue integration

Tabulator manages its own DOM inside its container element — it wasn't designed with a virtual-DOM framework in mind. The safe pattern in Vue is: **create the table once when the component mounts, destroy it when the component unmounts, and push data changes into Tabulator's own methods rather than relying on Vue's reactivity to re-render it.**

## Minimal wrapper component (Composition API, `<script setup>`)

```vue
<template>
  <div ref="tableContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";

const props = defineProps({
  rows: { type: Array, required: true },
});

const tableContainer = ref(null);
let table = null;

onMounted(() => {
  table = new Tabulator(tableContainer.value, {
    height: "400px",
    layout: "fitColumns",
    data: [...props.rows],           // shallow copy, see note below
    columns: [
      { title: "Name", field: "name" },
      { title: "Age", field: "age", sorter: "number" },
    ],
  });
});

onUnmounted(() => {
  table?.destroy(); // critical — see 11-pitfalls-for-ai-agents.md
  table = null;
});

// keep the table in sync when the prop changes from outside
watch(
  () => props.rows,
  (newRows) => {
    table?.setData(newRows);
  },
  { deep: true }
);
</script>
```

## Why not just bind `data` reactively and let Vue re-render?

Tabulator isn't a Vue component — passing a Vue `reactive`/`ref` array directly as the `data` option at construction time works for the *initial* render, but Tabulator will not react to subsequent mutations of that array the way a Vue-rendered `v-for` would. Two consequences to avoid:

1. **Don't** expect `props.rows.push(...)` or Vue reactivity alone to update the table — always call `table.setData(...)`/`updateData(...)`/`addRow(...)` explicitly (see [02-data-sources.md](02-data-sources.md) for which method to use).
2. **Don't** pass a live Vue-reactive array/object as `data` if you're also going to let Tabulator mutate it internally (e.g. via editing) — prefer plain, non-reactive objects going in (`[...props.rows]` / `structuredClone(props.rows)`), and flow edits *out* explicitly via `cellEdited`/`rowUpdated` events and an `emit(...)`, rather than relying on two-way reactive binding.

## Emitting edits back to the parent

```vue
<script setup>
const emit = defineEmits(["update:rows", "row-edited"]);

onMounted(() => {
  table = new Tabulator(tableContainer.value, { /* ... */ });
  table.on("cellEdited", (cell) => {
    emit("row-edited", cell.getRow().getData());
  });
});
</script>
```

## Reacting to column definitions changing

If `columns` themselves change dynamically (not just `data`), don't try to mutate the existing table's `columns` option — rebuild:

```js
watch(
  () => props.columnDefs,
  (newCols) => {
    table?.setColumns(newCols);
  }
);
```

`table.setColumns(...)` replaces the whole column definition set and is the supported way to change columns after construction.

## Options API equivalent

Same lifecycle mapping if you're not using `<script setup>`: create in `mounted()`, destroy in `beforeUnmount()`, keep a plain (non-reactive) reference to the table instance — e.g. store it on `this` via `Object.defineProperty` avoidance is unnecessary; just don't put the Tabulator instance itself inside `data()`, since Vue would try to make it reactive (wrapping a complex class instance in a Proxy). Keep it as a plain non-reactive instance property instead (e.g. assign directly to `this.table` outside of `data()`'s returned object, or use `markRaw()` from Vue if you do need to store it in reactive state).

```js
import { markRaw } from "vue";
// ...
this.table = markRaw(new Tabulator(this.$refs.tableContainer, { /* ... */ }));
```

## Next

→ [11-pitfalls-for-ai-agents.md](11-pitfalls-for-ai-agents.md)
