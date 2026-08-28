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
