# Quickstart

## Choose an install method

**Full build (default choice)** — every module pre-registered, no `registerModule` calls needed. Use this unless bundle size is a stated concern.

CDN:
```html
<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet">
<script src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"></script>
```

npm:
```bash
npm install tabulator-tables
```
```js
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
```

**Modular build** — only pull this in if bundle size genuinely matters and you know exactly which features you need:
```js
import { Tabulator, SortModule, FilterModule, FormatModule, EditModule, PageModule, AjaxModule } from "tabulator-tables";
Tabulator.registerModule([SortModule, FilterModule, FormatModule, EditModule, PageModule, AjaxModule]);
```
Every feature you use (formatters, filters, editors, ajax, pagination, grouping, etc.) needs its module registered or it fails silently. Full module list in `11-pitfalls.md#1-missing-module-registration-modular-build`. When in doubt, use the full build instead.

## Build the table

```html
<div id="example-table"></div>
```
The container must already exist in the DOM before construction. Don't put other markup inside it or mutate its children yourself — Tabulator owns that element.

```js
const table = new Tabulator("#example-table", {
  height: "400px",       // set an explicit height whenever possible — see 11-pitfalls.md
  layout: "fitColumns",
  data: [
    { id: 1, name: "Oli Bob",   age: 12, gender: "male" },
    { id: 2, name: "Mary May",  age: 1,  gender: "female" },
  ],
  columns: [
    { title: "Name",   field: "name" },
    { title: "Age",    field: "age", hozAlign: "right", sorter: "number" },
    { title: "Gender", field: "gender" },
  ],
});
```

## Core concepts to keep straight

- **`data`**: array of plain objects, one per row. Object keys must match each column's `field`.
- **`columns`**: array of column definitions — see `03-columns.md`.
- **`height`**: give it an explicit value (`"400px"`, `"100%"`, a px number). Without one, auto-sizing can misbehave inside flex/grid layouts or hidden containers — see `11-pitfalls.md#2-container-has-no-height-or-is-hidden-on-init`.
- **`layout`**: controls how column widths are computed — see `03-columns.md#layout-modes` for the full set of modes and when each applies.
- **The instance** (`table` above) is what you call every method on afterward: `table.setData(...)`, `table.getData()`, `table.on(...)`.
- **`tableBuilt`** event fires once the initial render is done. Data fetched via `ajaxURL` finishes asynchronously — use `table.on("dataLoaded", ...)` if you need to act once remote data has actually arrived.

```js
table.on("tableBuilt", () => console.log("ready"));
```

## If you're inside a framework component

Don't construct the table directly in a component body/render function. See `10-vue-integration.md` for the correct mount/unmount lifecycle — the concepts above are identical, only *when* you create/destroy the instance changes.

## Next

Loading real data → `02-data-sources.md`. Defining columns/formatters → `03-columns.md`.
