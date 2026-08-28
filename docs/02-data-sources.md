# 02 — Data sources

## Local data (array already in memory)

Pass it directly as `data` in the constructor, or set it later:

```js
const table = new Tabulator("#table", {
  data: myArray,
  columns: [ /* ... */ ],
});
```

```js
table.setData(newArray);       // replaces the entire dataset
```

### Updating data at runtime — pick the right method

This is the #1 source of confusion. Tabulator has several data-mutation methods that look similar but behave differently:

| Method | What it does | Use when |
|---|---|---|
| `table.setData(array)` | Replaces the whole dataset. Can also take a URL string (triggers an ajax request) or omit the argument to reload from the existing `ajaxURL`. | Full reset / initial load / reload from server |
| `table.replaceData(array)` | Alias-like behavior to `setData` for an array — replaces all rows but tries to keep scroll position and open groups/tree state. | Refreshing a list (e.g. polling) without jarring the user's scroll position |
| `table.updateData(array)` | Partially updates existing rows **by matching the table's index field** (`options.index`, default `"id"`). Rows not present in the array are left untouched; rows not found by index are ignored (not added). | Patching a few rows you know already exist |
| `table.updateOrAddData(array)` | Same as `updateData`, but adds rows that don't match an existing index. | Upserts |
| `table.addData(array, addToTop, index)` | Adds new rows without touching existing ones. | Appending rows |
| `table.addRow(rowData, addToTop, index)` | Adds a single row, returns a `RowComponent` you can act on immediately. | Adding one row and then e.g. scrolling to it |
| `table.deleteRow(rowIdOrComponent)` | Removes a single row by its index value or `RowComponent`. | Deleting one row |
| `table.updateRow(rowId, newData)` | Updates a single row's data (partial merge). | Patching one row |
| `table.clearData()` | Empties the table (keeps columns). | Clearing before a fresh load |

All of the above return a `Promise` — `await` them (or `.then()`) if you need to act once the DOM has actually updated, e.g. before calling `table.scrollToRow(...)`.

```js
await table.updateData([{ id: 3, age: 43 }]); // only patches row with id === 3
```

`updateData`/`updateOrAddData`/`updateRow` match rows using the field configured as `options.index` (defaults to `"id"`). If your primary key isn't literally `id`, set it explicitly:

```js
new Tabulator("#table", {
  index: "uuid", // now updateData/updateRow match on the "uuid" field instead of "id"
  // ...
});
```

## Remote data via built-in ajax (`ajaxURL`)

For a simple case where the server just returns the *full* dataset as JSON (no server-side pagination), let Tabulator fetch it for you:

```js
const table = new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  ajaxConfig: "GET",           // or a full fetch() options object, see below
  columns: [ /* ... */ ],
});
```

The response body must be an array of row objects (or an object shaped as configured by `ajaxResponse`, see below).

To send headers (auth tokens, etc.):

```js
ajaxConfig: {
  method: "GET",
  headers: { "Authorization": "Bearer " + token },
},
```

To reshape a non-array response (e.g. `{ status: "ok", rows: [...] }`) before Tabulator consumes it:

```js
ajaxResponse: function (url, params, response) {
  return response.rows;
},
```

For true **server-side** pagination/sorting/filtering (the server only returns one page at a time and needs to know what page/sort/filter to apply), see [09-server-side-integration.md](09-server-side-integration.md) — that's a materially different setup (`pagination: true` + `paginationMode: "remote"` + `filterMode`/`sortMode: "remote"`), not just `ajaxURL`.

### Fetching data yourself instead

You don't have to use `ajaxURL` at all — fetching with your own `fetch()`/axios and calling `setData()` works exactly the same and is often simpler to reason about, especially when you already have a data-fetching layer in your app:

```js
async function loadTable() {
  const res = await fetch("https://api.example.com/rows");
  const rows = await res.json();
  table.setData(rows);
}
```

## Pagination modes: local vs remote

- `paginationMode: "local"` (default when `pagination: true` is set without specifying a mode): Tabulator has the **entire** dataset in memory and just slices it client-side into pages. Simple, but doesn't scale to large datasets.
- `paginationMode: "remote"`: Tabulator asks the server for one page at a time via `ajaxURL`, and expects a specific JSON response shape. Required once your dataset is too large to send to the browser at once. Full details in [09-server-side-integration.md](09-server-side-integration.md).

```js
new Tabulator("#table", {
  pagination: true,
  paginationSize: 20,
  // paginationMode: "remote", // only for server-side pagination, see 09
});
```

## Progressive rendering (large *local* datasets)

If you have a large array already in memory (not paginated by a server) and want smooth scrolling instead of one huge DOM, `pagination` (local mode) is usually simpler and preferred. For infinite-scroll-style loading of a large local array, Tabulator virtualizes rendering automatically — you generally don't need extra config for local data.

## Next

→ [03-columns.md](03-columns.md) — defining columns, layout modes, and formatters.
