# Editing & validation

## Making a column editable

```js
{ title: "Name", field: "name", editor: "input" }
{ title: "Age", field: "age", editor: "number", editorParams: { min: 0, max: 120 } }
{ title: "Active", field: "active", editor: "tickCross", formatter: "tickCross" }
{ title: "Country", field: "country", editor: "list", editorParams: { values: ["FR", "US", "DE"] } }
{ title: "Notes", field: "notes", editor: "textarea" }
```
Built-in editors: `"input"`, `"textarea"`, `"number"`, `"range"`, `"tickCross"`, `"list"` (needs `values`), `"date"`, `"time"`, `"datetime"`, `"star"`.

### Conditional editability

`editable` gates *whether* editing is allowed (separate from `editor`, which defines the widget):
```js
{ title: "Salary", field: "salary", editor: "number",
  editable: (cell) => cell.getRow().getData().role !== "admin" }
```

## Custom editor function

```js
{
  title: "Color", field: "color",
  editor: (cell, onRendered, success, cancel) => {
    const input = document.createElement("input");
    input.type = "color";
    input.value = cell.getValue() || "#000000";
    onRendered(() => input.focus());
    input.addEventListener("change", () => success(input.value));
    input.addEventListener("blur", () => success(input.value));
    return input;
  },
}
```
Always call `success(newValue)` to commit or `cancel(originalValue)` to abort — forgetting either leaves the cell stuck in edit mode.

## Validators

```js
{ title: "Email", field: "email", editor: "input",
  validator: ["required", "string", { type: "regex", parameters: "^.+@.+\\..+$" }] }
```
Built-ins: `"required"`, `"unique"`, `"integer"`, `"float"`, `"number"`, `"string"`, `"boolean"`, `{ type: "min"|"max", parameters: N }`, `{ type: "minLength"|"maxLength", parameters: N }`, `{ type: "in", parameters: [...] }`, `{ type: "regex", parameters: "..." }`. Custom: `validator: (cell, value) => value % 2 === 0`.

Failed validation blocks the edit and adds a `.tabulator-invalid` class — style it, or listen for `validationFailed`.

## Reacting to edits

```js
table.on("cellEdited", (cell) => {
  fetch(`/api/rows/${cell.getRow().getData().id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [cell.getField()]: cell.getValue() }),
  });
});
table.on("validationFailed", (cell, value, validators) => { /* show a toast */ });
```

To roll back an edit after a failed server save:
```js
table.on("cellEdited", async (cell) => {
  try { await saveToServer(cell); }
  catch (e) { cell.restoreOldValue(); }
});
```

## Editing programmatically

```js
table.getRow(rowId).update({ age: 31 });        // partial merge
table.getRow(rowId).getCell("age").setValue(31); // single cell
```

## Undo / redo

```js
new Tabulator("#table", { history: true });
table.undo();
table.redo();
table.getHistoryUndoSize(); // check before enabling an "Undo" button
```

## Next

Events and row selection → `06-events-selection.md`.
