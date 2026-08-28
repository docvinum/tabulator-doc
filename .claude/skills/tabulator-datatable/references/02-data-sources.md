# Data sources

## Local data already in memory

```js
new Tabulator("#table", { data: myArray, columns: [ /* ... */ ] });
```

## Updating data at runtime — pick the right method

This is the most common source of bugs. These methods look interchangeable but aren't:

| Method | Behavior | Use when |
|---|---|---|
| `table.setData(array)` | Replaces the whole dataset. Can also take a URL string (triggers ajax) or no argument (reload from current `ajaxURL`). | Full reset / initial load / reload from server |
| `table.replaceData(array)` | Replaces all rows, tries to preserve scroll position and open groups/tree state. | Refreshing a list (e.g. polling) without jarring the user |
| `table.updateData(array)` | Patches existing rows **matched by the table's index field** (`options.index`, default `"id"`). Rows not present are untouched; rows in the array not matching an existing index are **ignored, not added**. | Patching a few rows you know already exist |
| `table.updateOrAddData(array)` | Same as `updateData`, but adds unmatched rows instead of ignoring them. | Upserts |
| `table.addData(array, addToTop, index)` | Adds new rows, doesn't touch existing ones. | Appending rows |
| `table.addRow(rowData, addToTop, index)` | Adds a single row, returns a `RowComponent`. | Adding one row you then act on immediately |
| `table.deleteRow(rowIdOrComponent)` | Removes one row. | Deleting one row |
| `table.updateRow(rowId, newData)` | Partial-merge update of one row. | Patching one row |
| `table.clearData()` | Empties the table, keeps columns. | Clearing before a fresh load |

All return a `Promise` — `await`/`.then()` before doing anything that depends on the DOM already reflecting the change (e.g. `scrollToRow`).

**Before calling `updateData`/`updateRow`/`updateOrAddData`**, confirm `options.index` actually matches your primary key field — if your key isn't literally `id`, set it:

```js
new Tabulator("#table", { index: "uuid", /* ... */ });
```

## Remote data via built-in ajax (whole dataset, no server-side pagination)

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  ajaxConfig: "GET", // or a full fetch()-style options object
  columns: [ /* ... */ ],
});
```

Response body must be an array of row objects (or reshape it — see below). For auth headers:

```js
ajaxConfig: { method: "GET", headers: { Authorization: "Bearer " + token } },
```

For a non-array response shape:

```js
ajaxResponse: (url, params, response) => response.rows,
```

For **true server-side pagination** (server returns one page at a time), this `ajaxURL` setup isn't enough — see `09-server-side-integration.md`, which needs `paginationMode: "remote"` plus a specific response shape.

You don't have to use `ajaxURL` at all — fetching yourself and calling `table.setData(rows)` works identically and is often simpler if the app already has a data layer.

## Pagination: local vs remote

- `paginationMode: "local"` (default with `pagination: true`): entire dataset already in memory, sliced client-side. Doesn't scale to large datasets.
- `paginationMode: "remote"`: server returns one page at a time. Required for large datasets. Full protocol in `09-server-side-integration.md`.

```js
new Tabulator("#table", { pagination: true, paginationSize: 20 });
```

## Next

Column definitions → `03-columns.md`. Real backend integration → `09-server-side-integration.md`.
