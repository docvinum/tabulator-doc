---
name: tabulator-datatable
description: >
  Use when implementing an interactive datatable/grid/spreadsheet-like table in a web UI —
  sortable/filterable columns, pagination, inline editing, row selection, grouping, or
  CSV/Excel/PDF export. Builds it with Tabulator (https://tabulator.info), a dependency-free
  JS table library, covering vanilla JS, Vue integration, and server-side (remote
  pagination/sort/filter) setups. Trigger on requests like "datatable", "data table", "grid",
  "table with sorting/filtering", "editable table", "paginated table", "export table to
  CSV/Excel" — even when Tabulator isn't named explicitly. SKIP when the user's request or the
  existing codebase already names a different table library (ag-Grid, DataTables.net, MUI
  DataGrid, PrimeVue/PrimeNG DataTable, TanStack Table, Handsontable, etc.) — respect that
  existing choice instead of overriding it.
---

# Tabulator datatable

Build interactive tables with [Tabulator](https://tabulator.info) ([GitHub](https://github.com/tabulator-tables/tabulator)). Target version: **v6.x**.

## Before writing any code

1. **Check for an existing choice.** If the codebase already has a table library installed (grep `package.json` / imports for `ag-grid`, `datatables.net`, `@mui/x-data-grid`, `primevue`/`primeng` table components, `@tanstack/table`, `handsontable`, etc.), use that instead — don't introduce Tabulator alongside an existing table solution.
2. **Know the one thing that causes silent failures**: if the project imports Tabulator as ES modules (`import { Tabulator } from 'tabulator-tables'`, not `TabulatorFull`), every feature beyond the bare table (sorting, filtering, editing, ajax, pagination, grouping...) requires its module to be registered via `Tabulator.registerModule(...)` or it does nothing, with no error. Default to `TabulatorFull` (or the CDN full build) unless bundle size is a stated concern. Full detail in `references/11-pitfalls.md`.

## The 80% case — minimal working table

```html
<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet">
<script src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"></script>
<div id="my-table"></div>
<script>
  new Tabulator("#my-table", {
    height: "400px",        // always set an explicit height — see references/11-pitfalls.md
    layout: "fitColumns",
    data: myRowsArray,       // array of plain objects
    columns: [
      { title: "Name", field: "name" },
      { title: "Age",  field: "age", sorter: "number", hozAlign: "right" },
    ],
  });
</script>
```

npm/module equivalent:

```js
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
```

If the request is this simple (static or already-fetched local data, default sorting, no editing/export/backend) and no other reference file applies, this snippet plus column definitions is enough — no need to open the reference files below.

## Reading map — open the relevant file(s) before implementing that part

| Task involves... | Open |
|---|---|
| Install choices, first table, core concepts | `references/01-quickstart.md` |
| Loading data from an API, or updating data after creation (which method to call) | `references/02-data-sources.md` |
| Column config, layout/width modes, formatters, frozen/grouped columns | `references/03-columns.md` |
| Sorting, header/external filters, row grouping, tree data | `references/04-sorting-filtering-grouping.md` |
| Editable cells, validators, undo | `references/05-editing-validation.md` |
| Click/edit events, row selection, callbacks | `references/06-events-selection.md` |
| Themes, conditional row/cell styling, responsive/small-screen layout | `references/07-styling-theming.md` |
| CSV/XLSX/PDF export, print, clipboard | `references/08-export-download.md` |
| The data comes from a real backend/API with actual server-side pagination, sorting, or filtering (not just a full array fetched once) | `references/09-server-side-integration.md` |
| Building inside a Vue component | `references/10-vue-integration.md` (read alongside 01/02) |
| **Something isn't working, or you're about to write the code and want to avoid known mistakes** | `references/11-pitfalls.md` — check this first when debugging |
| Quick lookup of an option/method/event name you already understand conceptually | `references/12-api-cheatsheet.md` |

## Before you ship — checklist

- [ ] Container has an explicit `height` (or a deliberate reason not to).
- [ ] Every sortable column sets `sorter` explicitly (`"number"`, `"date"`, etc.) — don't rely on auto-detection.
- [ ] Using the right data-update method (`setData` vs `updateData` vs `updateOrAddData` vs `addData`) for what you actually need — see `references/02-data-sources.md`.
- [ ] If Tabulator is mounted inside a framework component (Vue, React, etc.): the instance is created once on mount, not on every render, and `table.destroy()` runs on unmount.
- [ ] If using the modular (non-`TabulatorFull`) import: every feature used has its module registered.
- [ ] No untrusted/user-controlled string is rendered through the `"html"` formatter (or a custom formatter returning raw HTML) without sanitizing it first.
- [ ] If paginating/sorting/filtering server-side: the ajax response is reshaped (via `ajaxResponse`) to the `{ data, last_page }` object Tabulator expects, and request params are remapped (via `ajaxURLGenerator`) to match the backend's actual query format.

For the full list of failure modes and fixes, see `references/11-pitfalls.md`.
