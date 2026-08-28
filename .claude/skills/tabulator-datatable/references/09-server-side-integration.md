# Server-side integration (remote pagination, sort, filter)

Use this when the dataset is too large to send to the browser at once, so the server does pagination/sorting/filtering instead of Tabulator doing it in-memory.

## Remote pagination

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  pagination: true,
  paginationMode: "remote",
  paginationSize: 20,
  columns: [ /* ... */ ],
});
```

By default Tabulator sends `page` (1-indexed) and `size` as request params, and expects the response shaped as:

```json
{ "data": [ "... up to `size` rows ..." ], "last_page": 8 }
```

- `data` — rows for the requested page only.
- `last_page` — total page count, used to render pager UI state.

If your API's param names or response shape differ (common — e.g. `?page=2&per_page=20` and `{ items: [...], total_pages: 8 }`), remap both directions:

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  pagination: true,
  paginationMode: "remote",
  paginationSize: 20,
  ajaxURLGenerator: (url, config, params) =>
    `${url}?${new URLSearchParams({ page: params.page, per_page: params.size })}`,
  ajaxResponse: (url, params, response) => ({
    data: response.items,
    last_page: response.total_pages,
  }),
});
```

## Remote sorting

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  sortMode: "remote",
  columns: [
    { title: "Name", field: "name", sorter: "string" },
    { title: "Age", field: "age", sorter: "number" },
  ],
});
```
`sortMode: "remote"` appends a `sort` array param describing the active sort (e.g. `sort[0][field]=age&sort[0][dir]=desc`). Inspect the actual outgoing request and adjust `ajaxURLGenerator` if the backend expects a different format — same pattern as pagination above.

## Remote filtering

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  filterMode: "remote",
  columns: [{ title: "Name", field: "name", headerFilter: "input" }],
});
```
Active filters (header filters and/or `table.setFilter(...)`) are sent as a `filter` param instead of applied client-side. Remap via `ajaxURLGenerator` as needed.

## Combining all three

`paginationMode`, `sortMode`, `filterMode` are independent — set all three to `"remote"` for a fully server-driven table. Tabulator automatically re-fires the ajax request with updated combined params whenever page/sort/filter changes; nothing manual needed.

## Auth headers / credentials

```js
new Tabulator("#table", {
  ajaxConfig: {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  },
});
```
If the token can change during the table's lifetime, don't bake it into a static `ajaxConfig` — compute it fresh per request with `ajaxRequestFunc` (this fully replaces built-in request logic, bypassing `ajaxURLGenerator`/`ajaxConfig`):

```js
new Tabulator("#table", {
  ajaxRequestFunc: (url, config, params) =>
    fetch(buildUrlWithParams(url, params), {
      headers: { Authorization: `Bearer ${getCurrentToken()}` },
    }).then((res) => res.json()),
});
```

## Error handling

```js
table.on("ajaxError", (error) => console.error("failed to load table data", error));
```

## Manually triggering a reload

```js
table.setData(); // no argument -> re-fetch from current ajaxURL with current page/sort/filter state
```

## Next

Vue integration → `10-vue-integration.md`.
