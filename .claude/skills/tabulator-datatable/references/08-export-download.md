# Export & download

## CSV / JSON / HTML — no extra dependency

```js
table.download("csv", "data.csv");
table.download("json", "data.json");
table.download("html", "data.html", { style: true });
```

## XLSX — requires SheetJS

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```
```js
table.download("xlsx", "data.xlsx", { sheetName: "My Data" });
```
Just including the script before calling `download("xlsx", ...)` is enough — Tabulator detects the global `XLSX` object.

## PDF — requires jsPDF + jspdf-autotable

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
```
```js
table.download("pdf", "data.pdf", { orientation: "landscape", title: "My Table Export" });
```

## Scoping the export

4th argument to `download()` is the row range: `"active"` (default — filtered data, all pages) | `"selected"` | `"visible"`.
```js
table.download("csv", "selection.csv", {}, "selected");
```

Check the exact `download()` options signature against the installed version if you need custom column selection/renaming for export — it evolved between v5 and v6. When in doubt, build the export array yourself from `table.getData(...)` and generate the file directly with SheetJS/jsPDF for full control.

## Print

```js
table.print(false, true); // (selectedRowsOnly, includeVisibleColumnsOnly)
```

## Clipboard

```js
new Tabulator("#table", { clipboard: true }); // included in the full build
table.copyToClipboard("selected"); // or "active" / "all"
```
Paste-from-clipboard (e.g. from Excel) works automatically for editable cells once `clipboard: true` is set.

## Next

Real backend integration → `09-server-side-integration.md`.
