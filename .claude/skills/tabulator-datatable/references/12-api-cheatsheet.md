# API cheatsheet

Condensed lookup once the concepts from the other reference files are understood. Not exhaustive — see https://tabulator.info/docs/6.3 for the full reference.

## Constructor options (most used)

| Option | Type | Purpose |
|---|---|---|
| `data` | array | Initial local data |
| `ajaxURL` | string | Remote data endpoint |
| `columns` | array | Column definitions |
| `layout` | string | `fitData` \| `fitColumns` \| `fitDataFill` \| `fitDataStretch` \| `fitDataTable` |
| `height` | string/number | Fixed table height |
| `index` | string | Field used as row primary key (default `"id"`) |
| `pagination` | boolean | Enable pagination |
| `paginationMode` | string | `"local"` \| `"remote"` |
| `paginationSize` | number | Rows per page |
| `sortMode` | string | `"local"` (default) \| `"remote"` |
| `filterMode` | string | `"local"` (default) \| `"remote"` |
| `initialSort` | array | Sort applied on load |
| `groupBy` | string/function/array | Enable row grouping |
| `dataTree` | boolean | Enable hierarchical rows |
| `dataTreeChildField` | string | Field holding child rows |
| `selectableRows` | boolean/number | Enable row selection |
| `responsiveLayout` | string | `"collapse"` \| `"hide"` |
| `history` | boolean | Enable undo/redo |
| `clipboard` | boolean | Enable copy/paste |
| `rowFormatter` | function | Per-row custom styling/content |
| `rowHeight` | number | Fixed row height |
| `placeholder` | string | Message shown when data is empty |
| `ajaxConfig` | string/object | Fetch method/headers for `ajaxURL` |
| `ajaxRequestFunc` | function | Fully custom request logic |
| `ajaxURLGenerator` | function | Customize outgoing request URL/params |
| `ajaxResponse` | function | Reshape incoming response |

## Column definition options (most used)

`title`, `field`, `width`/`minWidth`/`maxWidth`, `hozAlign`, `headerHozAlign`, `sorter`, `formatter`, `formatterParams`, `editor`, `editorParams`, `editable`, `validator`, `headerFilter`, `headerFilterParams`, `visible`, `frozen`, `responsive`, `cssClass`, `mutator`, `columns` (for groups).

## Instance methods (most used)

```js
// data
table.setData(arrayOrUrl); table.replaceData(array); table.updateData(array);
table.updateOrAddData(array); table.addData(array, addToTop, index);
table.addRow(rowData, addToTop, index); table.updateRow(rowId, newData);
table.deleteRow(rowIdOrComponent); table.clearData();
table.getData(); table.getRow(rowId); table.getRows();

// columns
table.setColumns(columnDefs); table.getColumn(field); table.getColumns();
table.showColumn(field); table.hideColumn(field); table.toggleColumn(field);

// sort / filter / group
table.setSort(field, dir); table.clearSort();
table.setFilter(field, type, value); table.addFilter(field, type, value);
table.removeFilter(field, type, value); table.clearFilter(includeHeaderFilters);
table.setGroupBy(fieldOrFunction);

// selection
table.selectRow(rowIds); table.deselectRow();
table.getSelectedData(); table.getSelectedRows();

// pagination
table.setPage(pageNumber); table.getPage(); table.getPageMax();
table.previousPage(); table.nextPage();

// export
table.download(format, filename, options, rowRange);
table.copyToClipboard(rowRange);
table.print(selectedOnly, visibleColumnsOnly);

// history
table.undo(); table.redo();

// lifecycle
table.redraw(force); table.destroy();
```

## Events (most used)

`tableBuilt`, `dataLoaded`, `dataChanged`, `rowClick`, `rowDblClick`, `rowSelected`, `rowDeselected`, `rowSelectionChanged`, `cellClick`, `cellEdited`, `cellEditing`, `validationFailed`, `renderComplete`, `pageLoaded`, `ajaxError`.

```js
table.on(eventName, callback);
table.off(eventName, callback);
```

## Row/Cell component methods

```js
row.getData(); row.getElement(); row.update(data); row.delete();
row.select(); row.deselect(); row.isSelected(); row.scrollTo();

cell.getValue(); cell.getOldValue(); cell.getField();
cell.getRow(); cell.getColumn(); cell.setValue(v); cell.restoreOldValue();
```
