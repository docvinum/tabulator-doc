# 05 — Editing & validation

## Making a column editable

```js
{ title: "Name", field: "name", editor: "input" }
{ title: "Age",  field: "age",  editor: "number", editorParams: { min: 0, max: 120, step: 1 } }
{ title: "Active", field: "active", editor: "tickCross", formatter: "tickCross" }
{ title: "Country", field: "country", editor: "list", editorParams: { values: ["FR", "US", "DE"] } }
{ title: "Notes", field: "notes", editor: "textarea" }
{ title: "Due date", field: "dueDate", editor: "date" }
```

Common built-in editors: `"input"`, `"textarea"`, `"number"`, `"range"`, `"tickCross"` (checkbox), `"list"` (dropdown/autocomplete, needs `values` in `editorParams`), `"date"`, `"time"`, `"datetime"`, `"star"`.

### Conditional editability

`editor` can be a function returning `true`/`false` (via `editable` — note: `editable` gates *whether* editing is allowed, `editor` defines *what widget* is used):

```js
{
  title: "Salary",
  field: "salary",
  editor: "number",
  editable: (cell) => cell.getRow().getData().role !== "admin", // admins' salary is read-only
}
```

## Custom editor function

```js
{
  title: "Color",
  field: "color",
  editor: function (cell, onRendered, success, cancel, editorParams) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = cell.getValue() || "#000000";
    onRendered(() => input.focus());
    input.addEventListener("change", () => success(input.value));
    input.addEventListener("blur", () => success(input.value)); // commit on blur
    return input;
  },
}
```

Always call `success(newValue)` to commit, or `cancel(originalValue)` to abort — forgetting to call either leaves the cell stuck in edit mode.

## Validators

```js
{
  title: "Email",
  field: "email",
  editor: "input",
  validator: ["required", "string", { type: "regex", parameters: "^.+@.+\\..+$" }],
}
```

Built-in validators: `"required"`, `"unique"`, `"integer"`, `"float"`, `"number"`, `"string"`, `"boolean"`, `{ type: "min", parameters: N }`, `{ type: "max", parameters: N }`, `{ type: "minLength", parameters: N }`, `{ type: "maxLength", parameters: N }`, `{ type: "in", parameters: [...] }`, `{ type: "regex", parameters: "..." }`.

Custom validator function:

```js
validator: (cell, value) => value % 2 === 0, // must be even
```

If validation fails, Tabulator blocks the edit and adds an `.tabulator-invalid` CSS class to the cell (style it yourself, or listen for `validationFailed`).

## Reacting to edits

```js
table.on("cellEdited", (cell) => {
  console.log("new value:", cell.getValue(), "row:", cell.getRow().getData());
  // typical pattern: persist the change to your backend here
  fetch(`/api/rows/${cell.getRow().getData().id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [cell.getField()]: cell.getValue() }),
  });
});

table.on("cellEditing", (cell) => { /* fires when edit mode starts */ });
table.on("validationFailed", (cell, value, validators) => { /* show a toast, etc. */ });
```

To revert a specific edit programmatically (e.g. your backend PATCH failed):

```js
table.on("cellEdited", async (cell) => {
  try {
    await saveToServer(cell);
  } catch (e) {
    cell.restoreOldValue(); // rolls back to the value before this edit
  }
});
```

## Editing full rows programmatically

```js
const row = table.getRow(rowId);
row.update({ age: 31 });          // partial merge, triggers formatters/validators as needed
row.getCell("age").setValue(31);  // edit a single cell
```

## Undo / redo (built-in history)

```js
new Tabulator("#table", {
  history: true, // enables undo/redo tracking for edits, row add/delete, etc.
});

table.undo();
table.redo();
table.getHistoryUndoSize(); // check availability before enabling an "Undo" button
```

## Next

→ [06-events-selection.md](06-events-selection.md)
