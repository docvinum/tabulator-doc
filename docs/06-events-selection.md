# 06 — Events & selection

## Listening to events

Always use `table.on(eventName, callback)` — never assume an option like `rowClick` at the top level of the constructor does anything on its own for events (that pattern is used for some things like `groupHeader` but events are subscribed via `.on`).

```js
table.on("rowClick", (e, row) => {
  console.log("clicked row:", row.getData());
});
```

## Most-used events

| Event | Fires when | Callback signature |
|---|---|---|
| `tableBuilt` | Initial render complete | `()` |
| `dataLoaded` | New data has been loaded (`setData`/`ajaxURL`) | `(data)` |
| `dataChanged` | Table's data array changed for any reason | `(data)` |
| `rowClick` | User clicks a row | `(e, row)` |
| `rowDblClick` | User double-clicks a row | `(e, row)` |
| `rowSelected` | A row becomes selected | `(row)` |
| `rowDeselected` | A row becomes deselected | `(row)` |
| `cellClick` | User clicks a cell | `(e, cell)` |
| `cellEdited` | A cell's value is committed after editing | `(cell)` |
| `cellEditing` | A cell enters edit mode | `(cell)` |
| `validationFailed` | A validator rejected an edit | `(cell, value, validators)` |
| `renderComplete` | Full re-render finished (e.g. after filter/sort/resize) | `()` |
| `pageLoaded` | A new pagination page finished loading/rendering | `(pageNumber)` |
| `ajaxError` | An `ajaxURL` request failed | `(error)` |

Full list is longer (scroll, group, move-row, clipboard, etc.) — check https://tabulator.info/docs/6.3/events for anything not listed here.

## Row & cell components — the objects you get back

Event callbacks and most methods hand you a `RowComponent` or `CellComponent`, not raw data. Key methods:

```js
row.getData();        // the row's underlying data object
row.getElement();      // the row's DOM element
row.update({ ... });   // partial update
row.delete();
row.select();
row.deselect();
row.isSelected();
row.scrollTo();

cell.getValue();
cell.getOldValue();
cell.getField();
cell.getRow();
cell.getColumn();
cell.setValue(newVal);
cell.restoreOldValue();
```

## Row selection

Enable checkbox-style or click-to-select selection:

```js
new Tabulator("#table", {
  selectableRows: true,      // or a number to cap how many rows can be selected at once
  columns: [
    { formatter: "rowSelection", titleFormatter: "rowSelection", hozAlign: "center", width: 40 }, // checkbox column
    // ...
  ],
});

table.on("rowSelectionChanged", (data, rows) => {
  console.log("currently selected:", data); // array of row data objects
});
```

```js
table.getSelectedData();  // -> array of data for selected rows
table.getSelectedRows();  // -> array of RowComponent
table.selectRow([1, 2]);  // select by index value(s)
table.deselectRow();
```

## Keyboard navigation

Tabulator handles arrow-key navigation between editable cells automatically once a cell is focused/in edit mode; no extra config is generally required for basic tab/arrow movement between editable cells.

## Next

→ [07-styling-theming.md](07-styling-theming.md)
