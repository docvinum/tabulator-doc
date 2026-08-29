# Sorting, filtering, grouping

## Sorting

Click-to-sort is on by default per column once `sorter` is set. **Always set `sorter` explicitly** (`"string"`, `"number"`, `"date"`, `"boolean"`, `"alphanum"`) — auto-detection misjudges numeric strings, dates, and mixed data.

```js
{ title: "Age", field: "age", sorter: "number" }
```

Custom sorter:
```js
{
  title: "Priority", field: "priority",
  sorter: (a, b) => ({ high: 3, medium: 2, low: 1 }[a] - ({ high: 3, medium: 2, low: 1 }[b])),
}
```

Programmatic:
```js
table.setSort("age", "desc");
table.setSort([{ column: "age", dir: "desc" }, { column: "name", dir: "asc" }]); // multi-sort
table.clearSort();
```

Initial sort:
```js
new Tabulator("#table", { initialSort: [{ column: "age", dir: "desc" }] });
```

For sorting done server-side instead of in the browser, see `09-server-side-integration.md#remote-sorting`.

## Filtering

### Header filters (per-column input)

```js
{ title: "Name", field: "name", headerFilter: "input" }
{ title: "Age", field: "age", headerFilter: "number" }
{ title: "Gender", field: "gender", headerFilter: "list", headerFilterParams: { values: ["male", "female"] } }
```
Types: `"input"`, `"number"`, `"list"` (needs `values` in `headerFilterParams`), `"tickCross"`. Default match is "contains" for text, "=" otherwise — override with `headerFilterFunc`.

### Multiselect list filter (custom editor)

`headerFilter: "list"` with `headerFilterParams: { multiselect: true }` has weak UX — every click toggles a value, the dropdown never auto-closes, and the input just shows raw values comma-joined (no "3 selected" summary). For real multiselect UX, write a custom header filter: a function matching the editor signature, returning a node with a `value` get/set (`Object.defineProperty`) that the Filter module reads:

```js
function multiselectFilter(cell, onRendered, success, cancel, params) {
  const wrap = document.createElement("div");
  wrap.addEventListener("mousedown", (e) => e.stopPropagation()); // see 11-pitfalls #12
  let selected = [];
  // ...build a button/popup over params.values, toggle `selected` on click, success(selected)...
  Object.defineProperty(wrap, "value", {
    get: () => (selected.length ? selected.slice() : ""),
    set: (v) => { selected = Array.isArray(v) ? v : []; },
  });
  return wrap;
}
{ title: "Status", field: "status", headerFilter: multiselectFilter,
  headerFilterParams: { values: ["active", "paused", "closed"] }, headerFilterFunc: "in" }
```
`headerFilterFunc: "in"` expects an array value; return `""` (not `[]`) when nothing is selected so Tabulator treats the filter as cleared.

### Programmatic / external filters

For filter UI built outside the table:
```js
table.setFilter("age", ">", 18);
table.setFilter([{ field: "age", type: ">", value: 18 }, { field: "gender", type: "=", value: "female" }]); // AND
table.addFilter("name", "like", "smith");
table.removeFilter("age", ">", 18);
table.clearFilter(); // pass true to also clear header filter inputs
table.setFilter((data) => data.age > 18 && data.status !== "archived"); // custom function
```
Built-in types: `"="`, `"!="`, `"like"`, `"<"`, `"<="`, `">"`, `">="`, `"in"`, `"regex"`, `"starts"`, `"ends"`.

For filtering done server-side, see `09-server-side-integration.md#remote-filtering`.

## Grouping rows

```js
new Tabulator("#table", {
  groupBy: "department",
  groupHeader: (value, count) => `${value} (${count} employees)`,
});
```
Computed group key: `groupBy: (data) => data.age >= 18 ? "Adult" : "Minor"`. Multi-level: `groupBy: ["department", "team"]`. Toggle: `table.setGroupBy("department")` / `table.setGroupBy(false)`.

## Tree / hierarchical data

For parent-child rows where children are nested in the data itself (not derived from a flat list):

```js
new Tabulator("#table", {
  dataTree: true,
  dataTreeChildField: "_children",
  columns: [{ title: "Name", field: "name" }], // first visible column shows the expand arrow
});
// row shape: { id: 1, name: "Engineering", _children: [{ id: 2, name: "Frontend" }] }
```

**Don't confuse this with `groupBy`**: `groupBy` derives visual grouping from a flat array at render time; `dataTree` renders a hierarchy that must already exist as nested data. Different problems, not interchangeable.

## Next

Editable cells → `05-editing-validation.md`.
