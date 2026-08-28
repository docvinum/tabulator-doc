import { showToast } from "./persistence.js";

const NUMERIC_FIELDS = new Set(["salary", "rating"]);
const BOOLEAN_FIELDS = new Set(["is_manager"]);
const READONLY_FIELDS = new Set(["id"]);

function isEditingCell(table) {
  return !!(table.modules.edit && table.modules.edit.currentCell);
}

function coerce(field, raw) {
  if (NUMERIC_FIELDS.has(field)) {
    const n = Number(String(raw).replace(/[^\d.-]/g, ""));
    return Number.isNaN(n) ? raw : n;
  }
  if (BOOLEAN_FIELDS.has(field)) {
    return ["true", "vrai", "1", "oui", "yes"].includes(String(raw).trim().toLowerCase());
  }
  return raw;
}

function copyActiveRange(table) {
  const rangesData = table.getRangesData();
  if (!rangesData.length || !rangesData[0].length) return false;

  const tsv = rangesData[0]
    .map((row) => Object.values(row).map((v) => (v === null || v === undefined ? "" : v)).join("\t"))
    .join("\n");

  navigator.clipboard
    .writeText(tsv)
    .then(() => showToast(`${rangesData[0].length} ligne(s) copiee(s)`, "success"))
    .catch(() => showToast("Impossible de copier dans le presse-papiers", "error"));

  return true;
}

function pasteIntoActiveRange(table, text) {
  const ranges = table.getRanges();
  if (!ranges.length) return false;

  const structured = ranges[0].getCells(true, true);
  if (!structured.length) return false;

  const grid = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((line, idx, arr) => !(idx === arr.length - 1 && line === ""))
    .map((line) => line.split("\t"));

  if (!grid.length) return false;

  const singleValue = grid.length === 1 && grid[0].length === 1 ? grid[0][0] : null;
  let pasted = 0;

  table.blockRedraw();
  structured.forEach((cellRow, rIdx) => {
    const srcRow = grid[rIdx % grid.length];
    cellRow.forEach((cell, cIdx) => {
      const field = cell.getField();
      if (READONLY_FIELDS.has(field)) return;

      const raw = singleValue !== null ? singleValue : srcRow[cIdx % srcRow.length];
      if (raw === undefined) return;

      cell.setValue(coerce(field, raw));
      pasted += 1;
    });
  });
  table.restoreRedraw();

  if (pasted) showToast(`${pasted} cellule(s) collee(s)`, "info");
  return pasted > 0;
}

/**
 * Copier/coller Excel-like sur la plage de cellules active (module SelectRange de Tabulator).
 * getActiveTable() doit renvoyer l'instance Tabulator actuellement visible/active (onglet courant).
 */
export function setupRangeClipboard(getActiveTable) {
  // Ctrl/Cmd+C explicite (via l'API Clipboard) plutot que l'evenement "copy" du navigateur,
  // qui ne se declenche que s'il existe une selection de texte native (absente ici, la selection
  // de plage Tabulator est une selection logique sur des <div>, pas une selection de texte DOM).
  document.addEventListener("keydown", (e) => {
    const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c";
    if (!isCopy) return;

    const table = getActiveTable();
    if (!table || isEditingCell(table)) return;
    copyActiveRange(table);
  });

  document.addEventListener("paste", (e) => {
    const table = getActiveTable();
    if (!table || isEditingCell(table)) return;
    const text = e.clipboardData ? e.clipboardData.getData("text/plain") : "";
    if (!text) return;
    if (pasteIntoActiveRange(table, text)) e.preventDefault();
  });
}
