# 04 — Sorting, filtering, grouping

## Sorting

Sorting on click is enabled by default per column once a `sorter` is set. Always set `sorter` explicitly (`"string"`, `"number"`, `"date"`, `"boolean"`, `"alphanum"`) — Tabulator's auto-detection can misjudge numeric strings or mixed data.

```js
{ title: "Age", field: "age", sorter: "number" }
```

Custom sorter function:

```js
{
  title: "Priority",
  field: "priority",
  sorter: (a, b, aRow, bRow, column, dir, sorterParams) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[a] - order[b];
  },
}
```

Set sort programmatically:

```js
table.setSort("age", "desc");
table.setSort([{ column: "age", dir: "desc" }, { column: "name", dir: "asc" }]); // multi-sort
table.clearSort();
```

Initial sort at construction:

```js
new Tabulator("#table", {
  initialSort: [{ column: "age", dir: "desc" }],
  // ...
});
```

For sorting done by the server instead of in the browser, see [09-server-side-integration.md](09-server-side-integration.md#remote-sorting).

## Filtering

### Header filters (per-column input the user types into)

```js
{ title: "Name", field: "name", headerFilter: "input" }
{ title: "Age",  field: "age",  headerFilter: "number", headerFilterPlaceholder: "min age" }
{ title: "Gender", field: "gender", headerFilter: "list", headerFilterParams: { values: ["male", "female"] } }
```

Common `headerFilter` types: `"input"` (text), `"number"`, `"list"` (dropdown, needs `values` in `headerFilterParams`), `"tickCross"` (boolean checkbox).

By default header filters use a "like/contains" match for text and "=" for others. Override with `headerFilterFunc`, or set the comparison via `headerFilterFuncParams`.

### Multiselect list filter (custom editor)

The built-in `headerFilter: "list"` with `headerFilterParams: { multiselect: true }` has real UX limits: every click toggles a value and the dropdown never closes on its own, and the input just shows the raw selected values joined by commas — nothing indicates "3 selected" versus a single readable value. If a genuine multiselect (pick one and close, hold a modifier key to pick several) matters, write a custom header filter instead of the built-in editor. A header filter is any function matching the editor signature that returns a DOM node whose `value` property (a getter/setter, via `Object.defineProperty`) the Filter module reads:

```js
function multiselectFilter(cell, onRendered, success, cancel, params) {
  const wrap = document.createElement("div");
  wrap.addEventListener("mousedown", (e) => e.stopPropagation()); // see 11-pitfalls #12
  let selected = [];
  // ...build a button that opens a popup listing params.values, toggle `selected`
  // on click, call success(selected) to push the filter value...
  Object.defineProperty(wrap, "value", {
    get: () => (selected.length ? selected.slice() : ""),
    set: (v) => { selected = Array.isArray(v) ? v : []; },
  });
  return wrap;
}

{ title: "Status", field: "status", headerFilter: multiselectFilter,
  headerFilterParams: { values: ["active", "paused", "closed"] }, headerFilterFunc: "in" }
```

`headerFilterFunc: "in"` expects the value to be an array and matches rows whose field value is a member of it — return `""` (not `[]`) when nothing is selected, so Tabulator treats the filter as cleared rather than "match nothing".

### External / programmatic filters

For filter UI you build yourself (buttons, a search box outside the table, etc.):

```js
table.setFilter("age", ">", 18);
table.setFilter([
  { field: "age", type: ">", value: 18 },
  { field: "gender", type: "=", value: "female" },
]); // AND between array entries by default
table.addFilter("name", "like", "smith");   // adds to existing filters
table.removeFilter("age", ">", 18);
table.clearFilter();                          // clears all filters (pass true to also clear header filter inputs)
```

Custom filter function (when built-in operators aren't enough):

```js
table.setFilter((data) => data.age > 18 && data.status !== "archived");
```

Available built-in filter types (`type` in `setFilter`/`addFilter`): `"="`, `"!="`, `"like"`, `"<"`, `"<="`, `">"`, `">="`, `"in"`, `"regex"`, `"starts"`, `"ends"`.

For filtering done by the server instead of in the browser, see [09-server-side-integration.md](09-server-side-integration.md#remote-filtering).

## Grouping rows

```js
new Tabulator("#table", {
  groupBy: "department",
  groupHeader: (value, count, data, group) => `${value} (${count} employees)`,
});
```

Group by a computed value instead of a raw field:

```js
groupBy: (data) => data.age >= 18 ? "Adult" : "Minor",
```

Multiple levels of grouping:

```js
groupBy: ["department", "team"],
```

Toggle/collapse groups programmatically:

```js
table.setGroupBy("department");
table.setGroupBy(false); // remove grouping
```

## Tree / hierarchical data

For parent-child row structures (e.g. an org chart, nested categories) where children are nested arrays in the data itself:

```js
new Tabulator("#table", {
  dataTree: true,
  dataTreeChildField: "_children", // each row object may have a `_children: [...]` array
  columns: [
    { title: "Name", field: "name" }, // the first visible column shows the expand/collapse arrow
  ],
});
```

```js
// example row shape
{ id: 1, name: "Engineering", _children: [
  { id: 2, name: "Frontend" },
  { id: 3, name: "Backend" },
]}
```

This is a *different* feature from `groupBy` (which derives groups from a flat array at render time). Use `dataTree` when the hierarchy is inherent to the data; use `groupBy` when you're categorizing a flat list.

## Next

→ [05-editing-validation.md](05-editing-validation.md)
