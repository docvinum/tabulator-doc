# Columns

## Basic definition

```js
columns: [
  { title: "Name",  field: "name" },
  { title: "Age",   field: "age",  hozAlign: "right", sorter: "number", width: 100 },
  { title: "Email", field: "email" },
]
```

| Option | Purpose |
|---|---|
| `title` / `field` | Header text / data key |
| `width` / `minWidth` / `maxWidth` | Sizing (px number or `"10%"`) |
| `hozAlign` / `headerHozAlign` | Content / header alignment |
| `sorter` | `"string"` \| `"number"` \| `"date"` \| `"boolean"` \| `"alphanum"` \| function — **set explicitly**, auto-detection misjudges numeric strings, dates, etc. |
| `formatter` | Cell rendering — see below |
| `editor` | Makes the cell editable — see `05-editing-validation.md` |
| `visible` | `false` to hide (toggle later with `showColumn`/`hideColumn`) |
| `frozen` | `true` to pin during horizontal scroll |
| `headerFilter` | Adds a filter input in the header — see `04-sorting-filtering-grouping.md` |
| `responsive` | Priority for responsive collapse — see `07-styling-theming.md` |
| `cssClass` | Extra CSS class on every cell in the column |

## Layout modes

Set at the table level via `layout` — the most common source of "table looks wrong" bugs.

| `layout` | Behavior | Use when |
|---|---|---|
| `"fitData"` (default) | Columns size to content/header; table width = sum of columns. | Natural widths, horizontal scroll acceptable |
| `"fitColumns"` | Columns stretch/shrink to exactly fill container width. | The usual choice for a full-width table |
| `"fitDataFill"` | Like `fitData`, leftover space becomes blank space after the last column. | Natural widths, no gap-filling into columns |
| `"fitDataStretch"` | Like `fitData`, last column stretches to fill remaining space. | Natural widths + one flexible trailing column |
| `"fitDataTable"` | Table shrinks/grows to fit its data. | Small tables in flexible layouts |

**Gotcha**: `fitColumns`/`fitData*` compute widths from the container's *current* size. If the container is `display: none` or zero-width at construction (hidden tab, unopened modal), columns size wrong. Call `table.redraw(true)` once it becomes visible — see `11-pitfalls.md#2-container-has-no-height-or-is-hidden-on-init`.

## Formatters

Built-ins (`formatter: "..."`, options in `formatterParams`): `"plaintext"` (default), `"textarea"`, `"html"` (⚠️ see security note), `"money"` (`{ symbol, precision }`), `"date"` / `"datetime"` (`{ inputFormat, outputFormat }`), `"link"` (`{ urlField, target }`), `"image"`, `"tickCross"`, `"star"` (`{ stars }`), `"progress"`, `"color"`, `"lookup"` (`{ true: "Yes", false: "No" }`), `"rownum"`, `"responsiveCollapse"`.

```js
{ title: "Price", field: "price", formatter: "money", formatterParams: { symbol: "€", precision: 2 } }
```

Custom:
```js
{
  title: "Status",
  field: "status",
  formatter: (cell, formatterParams, onRendered) => {
    const value = cell.getValue();
    return `<span class="badge ${value === "active" ? "badge-green" : "badge-gray"}">${value}</span>`;
  },
}
```
`cell.getValue()`, `cell.getData()`, `cell.getRow()` cover most needs. `onRendered(cb)` runs after the returned HTML is attached to the DOM.

⚠️ **Security**: `"html"` and any custom formatter returning raw HTML injects it as-is. Never route user-controlled strings through it unsanitized — standard XSS vector. Default to `"plaintext"`/`"textarea"` for untrusted content.

## Derived values: mutator vs formatter

`formatter` only changes rendering, not the stored value. To transform the stored value itself (e.g. combine two fields into a persisted derived field), use `mutator`:

```js
{ title: "Full name", field: "fullName", mutator: (value, data) => `${data.firstName} ${data.lastName}` }
```

## Column groups (nested headers)

```js
columns: [
  { title: "Name", field: "name" },
  { title: "Contact", columns: [
    { title: "Email", field: "email" },
    { title: "Phone", field: "phone" },
  ]},
]
```

## Frozen columns

```js
{ title: "ID", field: "id", frozen: true }
```

## Toggling visibility at runtime

```js
table.hideColumn("email");
table.showColumn("email");
table.toggleColumn("email");
```

## Next

Sorting/filtering/grouping → `04-sorting-filtering-grouping.md`. Making columns editable → `05-editing-validation.md`.
