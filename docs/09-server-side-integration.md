# 09 — Server-side integration (remote pagination, sort, filter)

Use this setup once your dataset is too large to send to the browser in one response, and the server needs to do the pagination/sorting/filtering work instead of Tabulator doing it in-memory.

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

With `paginationMode: "remote"`, Tabulator automatically appends pagination parameters to the request. By default it sends:

- `page` — the page number being requested (1-indexed)
- `size` — the number of rows per page (matches `paginationSize`)

Your endpoint must respond with an object (not a bare array) shaped like:

```json
{
  "data": [ { "id": 1, "name": "..." }, "... up to `size` rows ..." ],
  "last_page": 8
}
```

- `data` — the rows for the requested page only.
- `last_page` — total number of pages, so Tabulator can render the pager UI (next/prev, page numbers, disabled state at the end).

If your API's param names or response shape differ from Tabulator's defaults (very common — e.g. `?page=2&per_page=20` and `{ items: [...], total_pages: 8 }`), remap both directions:

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  pagination: true,
  paginationMode: "remote",
  paginationSize: 20,

  // rename outgoing params
  ajaxURLGenerator: (url, config, params) => {
    const search = new URLSearchParams({
      page: params.page,
      per_page: params.size,
    });
    return `${url}?${search.toString()}`;
  },

  // reshape the incoming response into what Tabulator expects
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
    { title: "Age",  field: "age",  sorter: "number" },
  ],
});
```

With `sortMode: "remote"`, Tabulator appends a `sort` array param to the ajax request describing the active sort, e.g. `sort[0][field]=age&sort[0][dir]=desc` (exact serialization depends on your `ajaxConfig`/`ajaxURLGenerator` — inspect the actual outgoing request in your network tab and adjust `ajaxURLGenerator` if your backend expects a different query format, same pattern as pagination above).

## Remote filtering

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
  filterMode: "remote",
  columns: [
    { title: "Name", field: "name", headerFilter: "input" },
  ],
});
```

With `filterMode: "remote"`, active filters (header filters and/or `table.setFilter(...)`) are sent as a `filter` param instead of being applied client-side. As with sorting, remap the param shape via `ajaxURLGenerator` if needed.

## Combining all three

`paginationMode`, `sortMode`, and `filterMode` are independent flags — set all three to `"remote"` together for a fully server-driven table. Every time the user changes page, sort, or filter, Tabulator fires a new ajax request with the updated combined params; you don't need to manually re-trigger anything.

## Authentication headers / credentials

```js
new Tabulator("#table", {
  ajaxConfig: {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
    credentials: "include", // if you need cookies sent cross-origin
  },
});
```

If the token can change during the table's lifetime (refresh, re-login), don't bake it into a static `ajaxConfig` object created once — use `ajaxRequestFunc` to compute headers fresh on every request:

```js
new Tabulator("#table", {
  ajaxRequestFunc: (url, config, params) => {
    return fetch(buildUrlWithParams(url, params), {
      method: "GET",
      headers: { "Authorization": `Bearer ${getCurrentToken()}` },
    }).then((res) => res.json());
  },
});
```

`ajaxRequestFunc` fully replaces Tabulator's built-in request logic — when you use it, `ajaxURLGenerator`/`ajaxConfig` are bypassed for that request and it's on you to build the URL/params and return a promise resolving to the parsed response body.

## Error handling

```js
new Tabulator("#table", {
  ajaxURL: "https://api.example.com/rows",
});

table.on("ajaxError", (error) => {
  console.error("failed to load table data", error);
  // show a toast / retry button, etc.
});
```

## Manually triggering a reload (e.g. after an external filter UI change)

```js
table.setData(); // no argument -> re-fetches from the current ajaxURL with current page/sort/filter state
```

## Next

→ [10-vue-integration.md](10-vue-integration.md)
