# Tabulator documentation — index

This is a guide for implementing datatables with **[Tabulator](https://www.tabulator.info/)** v6.x. It's written so an AI coding agent can jump straight to the relevant file, copy a working snippet, and adapt it — without re-deriving the API from the official docs each time.

Official references (use these for anything not covered here, or to double-check an option name):
- Docs: https://tabulator.info/docs/6.3
- Full API reference: https://tabulator.info/docs/6.3/columns
- GitHub: https://github.com/tabulator-tables/tabulator
- Live examples: https://tabulator.info/examples/6.3

## Reading order

| # | File | Read this when you need to... |
|---|------|-------------------------------|
| 01 | [Quickstart](01-quickstart.md) | Install Tabulator and render a first table |
| 02 | [Data sources](02-data-sources.md) | Load local data, fetch data from an API, or update data at runtime |
| 03 | [Columns](03-columns.md) | Define columns, control layout/width, format cell content |
| 04 | [Sorting, filtering, grouping](04-sorting-filtering-grouping.md) | Add sort, filters, groups, or a tree structure |
| 05 | [Editing & validation](05-editing-validation.md) | Make cells editable and validate user input |
| 06 | [Events & selection](06-events-selection.md) | React to clicks/edits, select rows, wire up callbacks |
| 07 | [Styling & theming](07-styling-theming.md) | Change the look, style rows/cells conditionally, handle small screens |
| 08 | [Export & download](08-export-download.md) | Let users export to CSV/XLSX/PDF/JSON, print, or copy to clipboard |
| 09 | [Server-side integration](09-server-side-integration.md) | Do pagination/sort/filter on a real backend instead of in the browser |
| 10 | [Vue integration](10-vue-integration.md) | Use Tabulator inside a Vue 3 component the right way |
| 11 | [Pitfalls for AI agents](11-pitfalls-for-ai-agents.md) | **Something isn't working — check this first** |
| 12 | [API cheatsheet](12-api-cheatsheet.md) | Quick lookup of the most-used options/methods/events |

## The one thing to know before anything else

Tabulator v6's npm package is **modular**: if you build from ES modules instead of using the prebuilt bundle, every feature beyond the bare table core (sorting, filtering, editing, formatters, ajax, etc.) is a separate module that must be explicitly registered with `Tabulator.registerModule(...)` before use, or it will silently not work. See [01-quickstart.md](01-quickstart.md#modular-vs-full-build) and [11-pitfalls-for-ai-agents.md](11-pitfalls-for-ai-agents.md#1-missing-module-registration-modular-build).
