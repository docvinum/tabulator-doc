# Styling & theming

## Base themes

Include exactly one theme CSS file — don't layer multiple:

```html
<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet">
<!-- alternatives: tabulator_bootstrap5.min.css, tabulator_bulma.min.css, tabulator_semanticui.min.css,
     tabulator_materialize.min.css, tabulator_midnight.min.css, tabulator_simple.min.css -->
```
Same files under `tabulator-tables/dist/css/...` when installed via npm.

## Conditional row styling

```js
new Tabulator("#table", {
  rowFormatter: (row) => {
    row.getElement().classList.toggle("row-overdue", row.getData().status === "overdue");
  },
});
```
Prefer toggling a CSS class over inline styles so hover states/dark mode still apply.

## Conditional cell styling

```js
// style only, content unchanged
{ title: "Status", field: "status", cssClass: "status-cell" }
```
```js
// content + style together
{
  title: "Status", field: "status",
  formatter: (cell) => {
    const value = cell.getValue();
    cell.getElement().classList.add(value === "late" ? "text-red-600" : "text-green-600");
    return value;
  },
}
```

## Checkboxes & tickCross

The `tickCross` editor/header filter renders a native `<input type="checkbox">` (tristate via `editorParams: { tristate: true }`, indeterminate state via the standard `:indeterminate` pseudo-class). Restyle it with `appearance: none` + a `::after` checkmark:

```css
.tabulator input[type="checkbox"] {
  appearance: none; position: relative;
  width: 14px; height: 14px;
  border: 1px solid #ccc; border-radius: 3px; background: #fff;
}
.tabulator input[type="checkbox"]:checked,
.tabulator input[type="checkbox"]:indeterminate { border-color: #2563eb; background: #2563eb; }
.tabulator input[type="checkbox"]:checked::after {
  content: ""; position: absolute; left: 4px; top: 1px; width: 3px; height: 6px;
  border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg);
}
```
If Tabulator sets an inline style (e.g. `marginTop`), override with `margin: 0 !important` — inline styles beat any stylesheet selector.

The `tickCross` **formatter** is different: no `<input>`, it injects an SVG (`.tabulator-tick`/`.tabulator-cross`) and sets `aria-checked="true"/"false"/"mixed"` on the cell. Style true/false via that attribute rather than icon shape alone — same-colored icons that differ only by glyph are easy to misread at a glance:

```css
.tabulator-cell[aria-checked="true"] .tabulator-tick { fill: #16a34a; }
.tabulator-cell[aria-checked="false"] .tabulator-cross { fill: #9aa2b1; }
```

If a boolean header filter should look like the formatted cell (colored badge) rather than a checkbox, restyling the `<input>` isn't enough — different DOM shape. Use a custom header filter function instead (see `04-sorting-filtering-grouping.md` multiselect section): render the badge yourself, cycle `""` → `true` → `false` on click, and set `headerFilterEmptyCheck: (v) => v !== true && v !== false` — `false` is falsy, so the default empty-check would otherwise treat "filtering for false" as "no filter".

## Responsive layout (small screens)

```js
new Tabulator("#table", {
  responsiveLayout: "collapse", // or "hide" to just drop columns with no expander
  columns: [
    { title: "Name", field: "name", responsive: 0 },  // 0 = never hide
    { title: "Email", field: "email", responsive: 1 },
    { title: "Phone", field: "phone", responsive: 2 }, // higher = hidden first
  ],
});
```
`"collapse"` mode adds the "+" expander column automatically — no need to add a `responsiveCollapse` formatter column yourself unless you want to control its position.

## Row height / density

```js
new Tabulator("#table", { layout: "fitColumns", rowHeight: 30 });
```
Combine with CSS overriding `.tabulator .tabulator-cell { padding: ... }` for a more compact look.

## Next

Export/download → `08-export-download.md`.
