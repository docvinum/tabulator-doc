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

## Styling native form controls (checkboxes, tickCross)

A few control types render as plain native `<input>` elements Tabulator doesn't theme itself — most commonly the `tickCross` editor/header filter, which is an `<input type="checkbox">` (tristate-capable via `editorParams: { tristate: true }`, indeterminate state exposed as the standard `:indeterminate` pseudo-class). To make it match a custom design instead of the browser default checkbox:

```css
.tabulator input[type="checkbox"] {
  appearance: none;
  position: relative;
  width: 14px;
  height: 14px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #fff;
}
.tabulator input[type="checkbox"]:checked,
.tabulator input[type="checkbox"]:indeterminate {
  border-color: #2563eb;
  background: #2563eb;
}
.tabulator input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 4px; top: 1px;
  width: 3px; height: 6px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
```

`appearance: none` removes native rendering, which is what lets `::after` draw a custom checkmark — browsers support pseudo-elements on `<input>` once it's been un-styled this way. If Tabulator (or your own editor code) sets an inline style like `style.marginTop`, override it with `margin: 0 !important`; an external stylesheet otherwise loses to an inline style regardless of selector specificity.

The `tickCross` **formatter** (as opposed to the editor) is different: it doesn't render an `<input>` at all, it injects an inline SVG with a `.tabulator-tick` or `.tabulator-cross` class, and sets `aria-checked="true"/"false"/"mixed"` on the cell itself. Style true/false through that attribute rather than relying on icon shape alone — two icons of the same color that differ only by glyph are easy to misread at a glance:

```css
.tabulator-cell[aria-checked="true"] .tabulator-tick { fill: #16a34a; }
.tabulator-cell[aria-checked="false"] .tabulator-cross { fill: #9aa2b1; }
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
