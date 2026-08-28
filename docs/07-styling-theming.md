# 07 — Styling & theming

## Base themes

Tabulator ships several ready-made CSS themes as separate files — include exactly one:

```html
<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet">
<!-- or one of: -->
<!-- tabulator_bootstrap5.min.css -->
<!-- tabulator_bulma.min.css -->
<!-- tabulator_semanticui.min.css -->
<!-- tabulator_materialize.min.css -->
<!-- tabulator_midnight.min.css -->
<!-- tabulator_simple.min.css -->
```

With npm, import the same file from `tabulator-tables/dist/css/...`.

Don't include more than one theme file — they're not designed to be layered, and combining them causes conflicting rules.

## Conditional row styling

```js
new Tabulator("#table", {
  rowFormatter: (row) => {
    const data = row.getData();
    if (data.status === "overdue") {
      row.getElement().style.backgroundColor = "#fee2e2";
    }
  },
});
```

Prefer toggling a CSS class over inline styles when you can, so real CSS (hover states, dark mode, etc.) still applies:

```js
rowFormatter: (row) => {
  row.getElement().classList.toggle("row-overdue", row.getData().status === "overdue");
},
```

## Conditional cell styling

Two options, pick based on whether you also need to change the displayed content:

```js
// Option 1: cssClass — style only, content unchanged
{ title: "Status", field: "status", cssClass: "status-cell" }
```

```js
// Option 2: formatter — change both content and appearance together
{
  title: "Status",
  field: "status",
  formatter: (cell) => {
    const value = cell.getValue();
    cell.getElement().classList.add(value === "late" ? "text-red-600" : "text-green-600");
    return value;
  },
}
```

## Responsive layout (small screens)

Collapse lower-priority columns into an expandable "+" row instead of horizontal scrolling:

```js
new Tabulator("#table", {
  responsiveLayout: "collapse", // or "hide" to just drop columns with no expander
  columns: [
    { title: "Name", field: "name", responsive: 0 },   // 0 = never hide
    { title: "Email", field: "email", responsive: 1 },
    { title: "Phone", field: "phone", responsive: 2 },  // higher number = hidden first
  ],
});
```

`responsiveLayout: "collapse"` needs a formatter column to render the expander arrow — Tabulator adds it automatically as the first column when this mode is active; you don't need to add a `responsiveCollapse` formatter column yourself unless you want to control its position.

## Row height / density

```js
new Tabulator("#table", {
  layout: "fitColumns",
  rowHeight: 30, // fixed row height in px; omit to let content size rows naturally
});
```

For a "compact" visual density, combine a smaller `rowHeight` with CSS overriding the theme's default cell padding (`.tabulator .tabulator-cell { padding: ... }`).

## Next

→ [08-export-download.md](08-export-download.md)
