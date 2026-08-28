# 01 — Quickstart

## Installation

Tabulator ships two very different ways to install it. Pick one — mixing them causes confusing bugs.

### Option A — Full build via CDN (simplest, recommended for prototypes and most agent-generated code)

Pulls in the entire library, every module already registered. No `registerModule` calls needed.

```html
<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet">
<script type="text/javascript" src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"></script>
```

Then just use the global `Tabulator` class directly — see [Minimal example](#minimal-example) below.

### Option B — npm, full build (recommended for most real apps)

```bash
npm install tabulator-tables
```

```js
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
```

`TabulatorFull` is the pre-registered, all-modules-included export — use it unless you specifically need a smaller bundle.

### Option C — npm, modular build (smaller bundle, more setup)

```bash
npm install tabulator-tables
```

```js
import { Tabulator, SortModule, FilterModule, FormatModule, EditModule, PageModule, AjaxModule } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';

Tabulator.registerModule([SortModule, FilterModule, FormatModule, EditModule, PageModule, AjaxModule]);
```

**Only use Option C if bundle size actually matters and you know exactly which features you need.** Every feature described later in this guide (formatters, filters, editors, ajax, pagination, grouping, etc.) requires its module to be registered first, or it fails silently with no error. When in doubt, use Option A or B. See [11-pitfalls-for-ai-agents.md](11-pitfalls-for-ai-agents.md#1-missing-module-registration-modular-build) for the full list of module names.

## Minimal example

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet">
</head>
<body>
  <!-- The container MUST exist in the DOM before you construct the table -->
  <div id="example-table"></div>

  <script src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"></script>
  <script>
    const table = new Tabulator("#example-table", {
      height: "400px",          // a fixed height (or "100%") is strongly recommended, see below
      layout: "fitColumns",
      data: [
        { id: 1, name: "Oli Bob",    age: 12, gender: "male",   height: 1.6 },
        { id: 2, name: "Mary May",   age: 1,  gender: "female", height: 1.8 },
        { id: 3, name: "Christine",  age: 42, gender: "female", height: 1.6 },
      ],
      columns: [
        { title: "Name",   field: "name" },
        { title: "Age",    field: "age",    hozAlign: "right", sorter: "number" },
        { title: "Gender", field: "gender" },
        { title: "Height", field: "height", hozAlign: "right", sorter: "number" },
      ],
    });
  </script>
</body>
</html>
```

That's a complete, working table with sortable columns (sorting is on by default per-column once you interact with the header).

## Core concepts

- **The container**: a `<div>` (or a CSS selector / DOM element reference) that Tabulator takes over completely — don't put other markup inside it, and don't manually mutate its children.
- **`data`**: an array of plain objects. Each object is one row. Field names in `data` must match `field` in your column definitions.
- **`columns`**: an array of column definition objects (see [03-columns.md](03-columns.md)).
- **`height`**: give the table an explicit height (`"400px"`, `"100%"`, or a number of px) whenever possible. Without it, Tabulator falls back to auto-sizing which can misbehave inside flex/grid containers or hidden tabs — see [pitfalls](11-pitfalls-for-ai-agents.md#2-container-has-no-height-or-is-hidden-on-init).
- **`layout`**: controls how column widths are calculated — `"fitColumns"` is the most common default (stretches columns to fill the width). Full details in [03-columns.md](03-columns.md#layout-modes).
- **The `Tabulator` instance** (`table` in the example) exposes methods (`table.setData(...)`, `table.getData()`, `table.on(...)`, etc.) used for everything beyond the initial config — see later chapters.
- **`tableBuilt`**: an event that fires once the table has finished its initial render. Any code that needs to call methods on the table (e.g. `table.setData()`, `table.getColumn()`) right after construction should either run inside this event or simply be called after `new Tabulator(...)` returns (the constructor itself is synchronous enough for most method calls, but data fetched via built-in `ajaxURL` finishes asynchronously — use `table.on("dataLoaded", ...)` or the returned promise, see [02-data-sources.md](02-data-sources.md)).

```js
table.on("tableBuilt", function () {
  console.log("table ready", table.getData());
});
```

## Framework note

If you're inside Vue, don't just paste this snippet into a `<script setup>` — see [10-vue-integration.md](10-vue-integration.md) for the correct mount/unmount lifecycle. The concepts above are identical either way; only *when* you construct and destroy the table changes.

## Next

→ [02-data-sources.md](02-data-sources.md) — loading local data, remote/API data, and updating data after creation.
