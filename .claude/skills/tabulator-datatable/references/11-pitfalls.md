# Pitfalls

Check this list first whenever a Tabulator implementation "doesn't work" — most failures fall into one of these.

## 1. Missing module registration (modular build)

**Symptom**: a feature (sorting, filtering, editing, formatters, ajax, pagination, grouping...) silently does nothing — no console error.

**Cause**: modular npm import (`import { Tabulator } from 'tabulator-tables'`, not `TabulatorFull`) without registering the module that feature belongs to.

**Fix**: switch to the full build (simplest, recommended default):
```js
import { TabulatorFull as Tabulator } from "tabulator-tables";
```
...or register exactly the modules used:
```js
import { Tabulator, SortModule, FilterModule, EditModule, FormatModule, PageModule, AjaxModule, ResponsiveLayoutModule, SelectRowModule, GroupRowsModule, HistoryModule, ClipboardModule, ExportModule, DataTreeModule, FrozenColumnsModule, MoveColumnsModule, MoveRowsModule, InteractionModule, KeybindingsModule } from "tabulator-tables";

Tabulator.registerModule([
  SortModule, FilterModule, EditModule, FormatModule,
  PageModule, AjaxModule, ResponsiveLayoutModule,
  SelectRowModule, GroupRowsModule, HistoryModule,
  ClipboardModule, ExportModule, DataTreeModule,
  FrozenColumnsModule, MoveColumnsModule, MoveRowsModule,
  InteractionModule, KeybindingsModule,
]);
```
Check https://tabulator.info/docs/6.3/modules if unsure which module a feature needs. A CDN `<script>` full UMD bundle doesn't have this problem — every module is pre-registered.

## 2. Container has no height, or is hidden on init

**Symptom**: table renders with 0 height / collapses, or `fitColumns` computes wrong widths.

**Cause**: container had no CSS height (and no `height` option set), or was `display: none` (hidden tab, unopened modal) when `new Tabulator(...)` ran, so measured width/height was 0.

**Fix**: always set an explicit `height` unless auto-height-by-content is genuinely wanted. If the container can be hidden, only construct after it's visible, or call `table.redraw(true)` right after it becomes visible.

## 3. Using the wrong data-update method

**Symptom**: a data method call does nothing, wipes more than intended, or duplicates rows.

**Cause**: `setData`/`replaceData`/`updateData`/`updateOrAddData`/`addData` are not interchangeable — see `02-data-sources.md`. Most common mistake: calling `updateData([...])` expecting it to add new rows — it only patches rows matching an existing `index` and silently ignores unmatched ones.

**Fix**: use `updateOrAddData` for upsert behavior, `addData` to only add. Also verify `options.index` (default `"id"`) actually matches your primary key field.

## 4. Recreating the table on every re-render (React/Vue/Angular)

**Symptom**: flicker, lost scroll/sort/filter state, memory leak over time, sometimes errors on stale instances/detached DOM nodes.

**Cause**: `new Tabulator(...)` runs on every render/update instead of once on mount.

**Fix**: construct exactly once in a mount-only lifecycle hook; push subsequent changes through Tabulator's own methods (`setData`, `setColumns`, `setFilter`, etc.) — see `10-vue-integration.md`.

## 5. Not calling `destroy()` on unmount

**Symptom**: memory grows as tables mount/unmount repeatedly; duplicate listeners; errors referencing detached DOM nodes.

**Fix**:
```js
onUnmounted(() => { table?.destroy(); table = null; });
```

## 6. Confusing `groupBy` with `dataTree`

**Symptom**: expected nested/hierarchical rows but got flat grouped headers, or vice versa.

**Cause**: `groupBy` derives grouping headers from a flat array at render time; `dataTree` renders an actual parent/child hierarchy that must already exist as nested data. Different features — see `04-sorting-filtering-grouping.md`.

## 7. Server response shape mismatch in remote pagination

**Symptom**: remote pagination configured, requests fire, but pager shows only one page, no rows render, or a parsing error appears.

**Cause**: `paginationMode: "remote"` expects the response as `{ data: [...], last_page: N }` by default — not a bare array, not a different key name.

**Fix**: use `ajaxResponse` to reshape into `{ data, last_page }`, and `ajaxURLGenerator` to rename outgoing params if the backend doesn't use `page`/`size`. Full example in `09-server-side-integration.md#remote-pagination`.

## 8. XSS via the `"html"` formatter or a custom formatter returning raw HTML

**Symptom**: a real security issue, not just a bug — any column using `formatter: "html"` (or a custom formatter returning raw HTML) renders unescaped content from that field.

**Fix**: never route user-controlled or untrusted string data through `"html"` (or an HTML-returning custom formatter) without sanitizing/escaping first. Default to `"plaintext"`/`"textarea"` for anything not fully trusted, developer-authored content.

## 9. Assuming a v5 option name still works in v6 (or vice versa)

**Symptom**: a config option copied from an older source has no effect.

**Cause**: v6 restructured the module system (see #1) and renamed some options versus v5.

**Fix**: check the installed `tabulator-tables` version against the docs version being read — `https://tabulator.info/docs/6.3/...` vs `.../5.5/...` — don't mix guidance across major versions.

## 10. Forgetting `sorter`, causing wrong sort order

**Symptom**: a numeric/date column sorts as "10, 100, 2, 20" (lexicographic).

**Cause**: `sorter` left to auto-detection on values that are numbers-as-strings or mixed types.

**Fix**: always set `sorter: "number"` / `"date"` explicitly per column — see `03-columns.md` and `04-sorting-filtering-grouping.md`.
