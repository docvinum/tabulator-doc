# Vue integration

Tabulator manages its own DOM inside its container — it isn't a virtual-DOM component. Rule: **create the instance once on mount, destroy it on unmount, push data changes through Tabulator's own methods rather than relying on Vue reactivity to re-render it.**

## Wrapper component (Composition API, `<script setup>`)

```vue
<template>
  <div ref="tableContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";

const props = defineProps({ rows: { type: Array, required: true } });
const tableContainer = ref(null);
let table = null;

onMounted(() => {
  table = new Tabulator(tableContainer.value, {
    height: "400px",
    layout: "fitColumns",
    data: [...props.rows], // shallow copy — see note below
    columns: [
      { title: "Name", field: "name" },
      { title: "Age", field: "age", sorter: "number" },
    ],
  });
});

onUnmounted(() => {
  table?.destroy(); // critical — see 11-pitfalls.md#5-not-calling-destroy-on-unmount
  table = null;
});

watch(() => props.rows, (newRows) => table?.setData(newRows), { deep: true });
</script>
```

## Why not bind `data` reactively and let Vue re-render?

Tabulator won't react to mutations of a Vue-reactive array the way `v-for` would.

1. **Don't** expect `props.rows.push(...)` or Vue reactivity alone to update the table — always call `setData`/`updateData`/`addRow` explicitly (pick the right one per `02-data-sources.md`).
2. **Don't** pass a live Vue-reactive array/object as `data` if Tabulator will also mutate it internally (editing). Pass plain, non-reactive objects in (`[...props.rows]` / `structuredClone(props.rows)`), and flow edits *out* explicitly via `cellEdited` + `emit(...)` rather than two-way reactive binding.

## Emitting edits back to the parent

```js
const emit = defineEmits(["row-edited"]);
table.on("cellEdited", (cell) => emit("row-edited", cell.getRow().getData()));
```

## Changing columns dynamically

Don't mutate the existing `columns` option — rebuild via the supported method:
```js
watch(() => props.columnDefs, (newCols) => table?.setColumns(newCols));
```

## Options API equivalent

Same lifecycle mapping without `<script setup>`: create in `mounted()`, destroy in `beforeUnmount()`. Don't store the Tabulator instance inside `data()` — Vue would wrap it in a reactivity Proxy. If you need it in reactive state, wrap with `markRaw()`:

```js
import { markRaw } from "vue";
this.table = markRaw(new Tabulator(this.$refs.tableContainer, { /* ... */ }));
```

## Next

If something isn't behaving as expected → `11-pitfalls.md`.
