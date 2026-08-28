# Events & selection

## Listening to events

Always subscribe via `table.on(eventName, callback)`.

```js
table.on("rowClick", (e, row) => console.log(row.getData()));
```

## Most-used events

| Event | Fires when | Signature |
|---|---|---|
| `tableBuilt` | Initial render complete | `()` |
| `dataLoaded` | New data loaded (`setData`/`ajaxURL`) | `(data)` |
| `dataChanged` | Table's data array changed | `(data)` |
| `rowClick` / `rowDblClick` | Row clicked/double-clicked | `(e, row)` |
| `rowSelected` / `rowDeselected` | Row selection changed | `(row)` |
| `cellClick` | Cell clicked | `(e, cell)` |
| `cellEdited` | Edit committed | `(cell)` |
| `cellEditing` | Edit mode started | `(cell)` |
| `validationFailed` | Validator rejected an edit | `(cell, value, validators)` |
| `renderComplete` | Full re-render finished | `()` |
| `pageLoaded` | New pagination page rendered | `(pageNumber)` |
| `ajaxError` | `ajaxURL` request failed | `(error)` |

Full list: https://tabulator.info/docs/6.3/events (scroll/group/move-row/clipboard events not listed above).

## Row & cell components

```js
row.getData(); row.getElement(); row.update({...}); row.delete();
row.select(); row.deselect(); row.isSelected(); row.scrollTo();

cell.getValue(); cell.getOldValue(); cell.getField();
cell.getRow(); cell.getColumn(); cell.setValue(v); cell.restoreOldValue();
```

## Row selection

```js
new Tabulator("#table", {
  selectableRows: true, // or a number to cap selection count
  columns: [
    { formatter: "rowSelection", titleFormatter: "rowSelection", hozAlign: "center", width: 40 },
    // ...
  ],
});
table.on("rowSelectionChanged", (data, rows) => console.log(data));
```
```js
table.getSelectedData();
table.getSelectedRows();
table.selectRow([1, 2]);
table.deselectRow();
```

## Next

Styling and responsive layout → `07-styling-theming.md`.
