# 03 — Columns

## Basic column definition

```js
columns: [
  { title: "Name",  field: "name" },
  { title: "Age",   field: "age",  hozAlign: "right", sorter: "number", width: 100 },
  { title: "Email", field: "email", visible: true },
]
```

Common options:

| Option | Purpose |
|---|---|
| `title` | Header text shown to the user |
| `field` | Key in each row's data object this column reads/writes |
| `width` / `minWidth` / `maxWidth` | Column sizing (px number or `"10%"`) |
| `hozAlign` | `"left"` \| `"center"` \| `"right"` — horizontal cell content alignment |
| `headerHozAlign` | Same, but for the header |
| `sorter` | `"string"` \| `"number"` \| `"date"` \| `"boolean"` \| `"alphanum"` \| custom function — **set this explicitly**, auto-detection is unreliable for numbers stored as strings, dates, etc. |
| `formatter` | How the cell value is rendered — see [Formatters](#formatters) |
| `editor` | Makes the cell editable — see [05-editing-validation.md](05-editing-validation.md) |
| `visible` | `false` to hide initially (can be toggled later with `table.showColumn`/`hideColumn`) |
| `frozen` | `true` to pin the column when horizontally scrolling |
| `headerFilter` | Adds a filter input in the header — see [04-sorting-filtering-grouping.md](04-sorting-filtering-grouping.md) |
| `responsive` | Priority for the responsive collapse layout — see [07-styling-theming.md](07-styling-theming.md) |
| `cssClass` | Extra CSS class added to every cell in the column |

## Layout modes

Set at the table level via `layout`, not per-column. This is one of the most common sources of "my table looks wrong" bugs.

| `layout` value | Behavior | Use when |
|---|---|---|
| `"fitData"` (default) | Every column sizes to fit its content/header; table width = sum of columns (may overflow or underflow the container). | You want columns exactly as wide as their content, and don't mind horizontal scroll or leftover space. |
| `"fitColumns"` | Columns stretch/shrink to exactly fill the container width. | The most common choice for a "normal" full-width table. |
| `"fitDataFill"` | Like `fitData`, but if there's leftover horizontal space it's added as blank space after the last column (columns don't stretch). | You want natural column widths but no ugly gap-filling into columns. |
| `"fitDataStretch"` | Like `fitData`, but the *last* column stretches to fill remaining space. | Natural widths except one flexible trailing column. |
| `"fitDataTable"` | Table itself shrinks/grows to fit its data (no scrollbar logic assumed). | Rare; small tables embedded in flexible layouts. |

```js
new Tabulator("#table", {
  layout: "fitColumns",
  // ...
});
```

**Gotcha**: `fitColumns` (and `fitData*` in general) compute widths based on the *current* size of the container. If the container is `display: none` or has zero width at construction time (e.g. inside a hidden tab, an unopened accordion, or a modal not yet shown), columns will size incorrectly or collapse. Call `table.redraw(true)` after the container becomes visible, or construct the table only once the container is visible. See [11-pitfalls-for-ai-agents.md](11-pitfalls-for-ai-agents.md#2-container-has-no-height-or-is-hidden-on-init).

## Formatters

Built-in formatters (pass the string as `formatter`, with options in `formatterParams`):

| Formatter | Renders |
|---|---|
| `"plaintext"` (default) | Raw text |
| `"textarea"` | Text with preserved line breaks |
| `"html"` | Raw HTML (⚠️ only use with trusted data — see security note below) |
| `"money"` | Formatted currency, e.g. `formatterParams: { symbol: "€", precision: 2 }` |
| `"date"` | Formatted date, e.g. `formatterParams: { inputFormat: "yyyy-MM-dd", outputFormat: "dd/MM/yyyy" }` |
| `"datetime"` | Same, with time |
| `"link"` | Clickable link, `formatterParams: { urlField: "url", target: "_blank" }` |
| `"image"` | `<img>` tag, `formatterParams: { height: "40px" }` |
| `"tickCross"` | ✓ / ✗ icon for boolean-ish values |
| `"star"` | Star rating, `formatterParams: { stars: 5 }` |
| `"progress"` | Progress bar |
| `"color"` | Renders the cell value as a background color swatch |
| `"lookup"` | Maps the raw value through a dictionary: `formatterParams: { true: "Yes", false: "No" }` |
| `"rownum"` | Row number |
| `"handle"` | Drag handle (for row reordering with the `MoveRows` module) |
| `"responsiveCollapse"` | Renders the "+" expander for hidden responsive columns — see [07](07-styling-theming.md) |
| `"buttonTick"` / `"buttonCross"` | Clickable icon buttons, typically combined with `cellClick` |

```js
{ title: "Price", field: "price", formatter: "money", formatterParams: { symbol: "€", precision: 2 } }
```

### Custom formatter function

```js
{
  title: "Status",
  field: "status",
  formatter: function (cell, formatterParams, onRendered) {
    const value = cell.getValue();
    const cls = value === "active" ? "badge-green" : "badge-gray";
    return `<span class="badge ${cls}">${value}</span>`;
  },
}
```

`cell.getValue()`, `cell.getData()` (full row data), and `cell.getRow()` are the main things you'll need inside a formatter. `onRendered(callback)` lets you run code *after* the returned HTML is actually attached to the DOM (needed if you want to measure it or attach a non-Tabulator widget like a chart).

⚠️ **Security**: the `"html"` formatter and any custom formatter that returns raw HTML will inject that HTML as-is. Never feed user-controlled strings into `"html"`/innerHTML-based formatters without sanitizing/escaping them first — this is a standard XSS vector.

## Calculated / derived columns (mutators & accessors)

To derive a display value from other fields without changing the underlying data, prefer a `formatter` (it only affects rendering). To actually transform the *stored* value (e.g. parse a string into a number on load), use a **mutator**:

```js
{
  title: "Full name",
  field: "fullName",
  mutator: (value, data) => `${data.firstName} ${data.lastName}`,
}
```

## Column groups (nested headers)

```js
columns: [
  { title: "Name", field: "name" },
  {
    title: "Contact",
    columns: [
      { title: "Email", field: "email" },
      { title: "Phone", field: "phone" },
    ],
  },
]
```

## Frozen (pinned) columns

```js
{ title: "ID", field: "id", frozen: true }
```

Put `frozen: true` on the columns you want pinned; they stay in place while the rest of the table scrolls horizontally. Order matters — frozen columns are pinned in the order they appear in the `columns` array (left side unless `frozen: "right"`... note: right-freezing support/behavior should be checked against the version in use, as it's the less common case).

## Column visibility toggling at runtime

```js
table.hideColumn("email");
table.showColumn("email");
table.toggleColumn("email");
```

## Next

→ [04-sorting-filtering-grouping.md](04-sorting-filtering-grouping.md)
