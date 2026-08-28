# 08 — Export & download

## CSV / JSON / HTML (no extra dependency)

```js
table.download("csv", "data.csv");
table.download("json", "data.json");
table.download("html", "data.html", { style: true }); // style: true inlines table CSS
```

## XLSX (requires SheetJS)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

```js
table.download("xlsx", "data.xlsx", { sheetName: "My Data" });
```

Tabulator detects the global `XLSX` object provided by SheetJS — just including the script before calling `download("xlsx", ...)` is enough, no extra wiring.

## PDF (requires jsPDF + jspdf-autotable)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
```

```js
table.download("pdf", "data.pdf", {
  orientation: "landscape",
  title: "My Table Export",
});
```

## Only exporting selected/visible rows

By default `download()` exports all data matching current filters/sort, across all pages. To scope it:

```js
table.download("csv", "selection.csv", {}, "selected"); // only selected rows
table.download("csv", "visible.csv", {}, "visible");     // only currently visible/active rows
```

(4th argument is the row range: `"active"` (default, filtered data across all pages) | `"selected"` | `"visible"`.)

## Custom column selection / renaming for export

```js
table.download("csv", "data.csv", {
  columnHeaders: true,
}, "active", {
  columns: [
    { field: "name", title: "Full Name" },
    { field: "email", title: "Email Address" },
  ],
});
```
(Check the exact signature against the version you're on — the download definition options evolved between v5 and v6; when unsure, prefer building the export array yourself from `table.getData(...)` and generating the file with SheetJS/jsPDF directly for full control.)

## Print

```js
table.print(false, true); // (selectedRowsOnly, includeVisibleColumnsOnly)
```

Or trigger the browser print dialog on a styled printable view — Tabulator has print-specific CSS handling built in via this method rather than relying on `window.print()` directly on the live table.

## Clipboard (copy/paste)

Requires the clipboard module (included in the full build):

```js
new Tabulator("#table", {
  clipboard: true,
});
```

```js
table.copyToClipboard("selected"); // or "active" / "all"
```

Paste-from-clipboard into the table (e.g. pasting from Excel) also works out of the box once `clipboard: true` is set and cells are editable — Tabulator parses tab/newline-delimited clipboard content into rows/cells automatically.

## Next

→ [09-server-side-integration.md](09-server-side-integration.md)
