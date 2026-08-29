# 11 — Pitfalls for AI agents

Check this list first whenever a Tabulator implementation "doesn't work" — most failures fall into one of these.

## 1. Missing module registration (modular build)

**Symptom**: a feature (sorting, filtering, editing, formatters, ajax, pagination, grouping...) silently does nothing — no console error, the option is just ignored.

**Cause**: you used the modular npm import (`import { Tabulator } from 'tabulator-tables'`, not `TabulatorFull`) without registering the module that feature belongs to.

**Fix**: either switch to the full build (simplest — recommended default):

```js
import { TabulatorFull as Tabulator } from "tabulator-tables";
```

...or register exactly the modules you use:

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

If unsure which module a feature needs, check https://tabulator.info/docs/6.3/modules — or just use `TabulatorFull`. When using a CDN `<script>` tag (the full UMD bundle), this problem doesn't exist at all — every module is pre-registered.

## 2. Container has no height, or is hidden on init

**Symptom**: the table renders with 0 height, collapses to nothing, or `layout: "fitColumns"` computes wrong widths (columns squeezed to near-zero or overflowing).

**Cause**: the container `<div>` had no CSS height (and Tabulator's own `height` option wasn't set), or the container was `display: none` (a hidden tab, an unopened modal/accordion) at the moment `new Tabulator(...)` ran, so its measured width/height was 0.

**Fix**:
- Always set an explicit `height` in the Tabulator config (`"400px"`, `"70vh"`, etc.) unless you specifically want auto-height based on content.
- If the table lives inside something that can be hidden (tabs, modals), only construct the table after the container is visible, or call `table.redraw(true)` immediately after it becomes visible:

```js
// e.g. when a tab becomes active
table.redraw(true); // true = also recalculate column widths, not just row heights
```

## 3. Using the wrong data-update method

**Symptom**: calling a method does nothing, wipes more than intended, or duplicates rows.

**Cause**: `setData` vs `replaceData` vs `updateData` vs `updateOrAddData` vs `addData` are **not** interchangeable — see the comparison table in [02-data-sources.md](02-data-sources.md#updating-data-at-runtime--pick-the-right-method). The most common mistake: calling `updateData([...])` expecting it to add new rows — it only patches rows matching an existing `index` value and silently ignores unmatched ones. Use `updateOrAddData` for upsert behavior, or `addData` to only add.

**Fix**: also double check `options.index` (default `"id"`) actually matches your primary key field name — if it doesn't, `updateData`/`updateRow` will never find a match.

## 4. Recreating the table on every re-render (React/Vue/Angular)

**Symptom**: table flickers, loses scroll/sort/filter state, or leaks memory over time; sometimes throws once a stale instance's container no longer exists in the DOM.

**Cause**: constructing `new Tabulator(...)` inside a function that runs on every render/update (e.g. directly in a Vue `setup()` body without an `onMounted` guard, or a React component body without `useEffect`) instead of once on mount.

**Fix**: construct exactly once (`onMounted`/`useEffect` with an empty dependency array/mount-only lifecycle), and push subsequent changes through Tabulator's own methods (`setData`, `setColumns`, `setFilter`, etc.) — see [10-vue-integration.md](10-vue-integration.md).

## 5. Not calling `destroy()` on unmount

**Symptom**: memory grows over time in a single-page app as tables are mounted/unmounted repeatedly (e.g. navigating between pages that each render a table); duplicate event listeners; errors referencing detached DOM nodes.

**Fix**: always call `table.destroy()` in the component's unmount/teardown lifecycle hook, and null out your reference to it.

```js
onUnmounted(() => {
  table?.destroy();
  table = null;
});
```

## 6. Confusing `groupBy` with `dataTree`

**Symptom**: expected nested/hierarchical rows but got flat grouped headers, or vice versa.

**Cause**: `groupBy` derives visual grouping headers from a *flat* array at render time (see [04](04-sorting-filtering-grouping.md#grouping-rows)); `dataTree` renders an actual parent/child hierarchy that must already exist as nested arrays in the data (see [04](04-sorting-filtering-grouping.md#tree--hierarchical-data)). They solve different problems and aren't interchangeable.

## 7. Server response shape mismatch in remote pagination

**Symptom**: remote pagination is configured, requests go out, but the pager UI shows only one page, or no rows render, or the console shows a data-parsing error.

**Cause**: Tabulator's `paginationMode: "remote"` expects the ajax response to be an **object** shaped `{ data: [...], last_page: N }` by default — not a bare array, and not a different key name (`items`, `rows`, `total_pages`, etc.) without remapping.

**Fix**: use `ajaxResponse` to reshape the response into `{ data, last_page }`, and `ajaxURLGenerator` to rename outgoing params if your backend doesn't use `page`/`size`. Full example in [09-server-side-integration.md](09-server-side-integration.md#remote-pagination).

## 8. XSS via the `"html"` formatter or a custom formatter returning raw HTML

**Symptom**: not a bug exactly — a real security issue: any column using `formatter: "html"` (or a custom formatter that returns a raw HTML string) will render unescaped HTML/script content coming from that field.

**Fix**: never route user-controlled or untrusted string data through `"html"` or an HTML-returning custom formatter without sanitizing/escaping it first (e.g. `textContent`-style escaping, or a sanitizer library if some HTML is intentionally allowed). Default to `"plaintext"`/`"textarea"` for any field that isn't fully trusted, developer-authored content.

## 9. Assuming an option name from v5 still works in v6 (or vice versa)

**Symptom**: a config option copied from an older blog post/Stack Overflow answer or the wrong doc version has no effect.

**Cause**: v6 renamed/restructured several things versus v5 — most notably the modular architecture itself (`registerModule`, see #1), and some option/module names changed. If you're pinning a specific version, always check the docs at the matching version path, e.g. `https://tabulator.info/docs/6.3/...` vs `https://tabulator.info/docs/5.5/...` — don't mix guidance from different major versions.

**Fix**: check the installed `tabulator-tables` version in `package.json`/CDN URL against the docs version you're reading.

## 10. Forgetting `sorter`/data types, causing wrong sort order

**Symptom**: a numeric or date column sorts as "10, 100, 2, 20" (lexicographic) instead of numerically.

**Cause**: `sorter` wasn't set (or was left to auto-detection) on a column whose values are numbers-as-strings, or actual `Date` objects vs formatted date strings.

**Fix**: always set `sorter: "number"` / `"date"` explicitly per column as shown in [03-columns.md](03-columns.md) and [04-sorting-filtering-grouping.md](04-sorting-filtering-grouping.md) — don't rely on auto-detection for anything but plain strings.

## 11. A custom global copy/paste handler swallows paste into every input on the page

**Symptom**: a Ctrl+C/Ctrl+V "Excel-like" clipboard feature built on top of `selectableRange` (copy a cell range, paste into a range of editable cells) works fine on the table itself, but pasting into *any* other input on the page — a search box, a header filter, a form field — silently does nothing, or replaces the wrong thing.

**Cause**: `document.addEventListener("paste", ...)` (or `"keydown"` for Ctrl+C) registered at the document level fires for every paste/copy anywhere on the page, not just inside the table. Without a target check, the handler unconditionally calls `e.preventDefault()` and redirects the clipboard content into the active cell range, hijacking the browser's native copy/paste for every other input.

**Fix**: bail out early when `e.target` is a text-entry element, before doing anything else:

```js
function isTextEntryTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

document.addEventListener("paste", (e) => {
  if (isTextEntryTarget(e.target)) return; // let the browser handle it natively
  // ...redirect into the selected range...
});
```

Do the same for the Ctrl+C handler, and also skip it when there's a native text selection outside the table (`window.getSelection()` non-collapsed and not inside `.tabulator`) — otherwise selecting and copying a sentence of page text next to the table copies the cell range instead.

## 12. Clicking inside a header filter selects the whole column instead of focusing the filter

**Symptom**: with `selectableRange`/`selectableRangeColumns` enabled, clicking into a header filter input (to type a value, or open a custom dropdown) instead selects the entire column — the header filter's text can even become unreadable (e.g. white-on-white) because it inherits the "selected column" text color.

**Cause**: Tabulator only calls `stopPropagation()` on the header filter's `mousedown` when `headerFilterLiveFilter` is not explicitly `false`. Any column with `headerFilterLiveFilter: false` (or a custom `headerFilter` function that doesn't opt into Tabulator's live-filter wiring) lets the `mousedown` bubble up to `SelectRange`'s column-header handler, which selects the column.

**Fix**: stop propagation yourself on the header filter's container:

```js
function myHeaderFilter(cell, onRendered, success, cancel, params) {
  const wrap = document.createElement("div");
  wrap.addEventListener("mousedown", (e) => e.stopPropagation());
  // ...build the actual input/control inside wrap...
  return wrap;
}
```

Also don't rely on inherited text color for header filter styling — give the filter's input/label an explicit `color` in CSS so it stays readable regardless of the column's selected/hover state.

## Next

→ [12-api-cheatsheet.md](12-api-cheatsheet.md) for a condensed lookup table once you've internalized the above.
