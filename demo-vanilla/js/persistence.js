/**
 * Cablage generique "edition -> validation -> sauvegarde via API -> gestion d'erreur".
 * Si `baseUrl` est absent (source JSON locale), les edits restent uniquement en memoire navigateur.
 */
export function attachPersistence(table, { baseUrl, sourceLabel } = {}) {
  table.on("validationFailed", (cell) => {
    flashCell(cell, "error");
    const title = cell.getColumn().getDefinition().title;
    showToast(`Valeur invalide pour la colonne "${title}"`, "error");
  });

  table.on("cellEdited", async (cell) => {
    const field = cell.getField();
    const value = cell.getValue();
    const id = cell.getRow().getData().id;

    if (!baseUrl) {
      flashCell(cell, "local");
      showToast(`Modification locale uniquement (source ${sourceLabel || "JSON"}, non persistee)`, "info");
      return;
    }

    flashCell(cell, "pending");
    try {
      const res = await fetch(`${baseUrl}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(formatApiError(body));
      }

      const updated = await res.json();
      cell.getRow().update(updated);
      flashCell(cell, "success");
    } catch (err) {
      cell.restoreOldValue();
      flashCell(cell, "error");
      showToast(`Echec de l'enregistrement: ${err.message}`, "error");
    }
  });
}

function formatApiError(body) {
  if (Array.isArray(body.detail)) {
    return body.detail
      .map((e) => `${e.field || (e.loc ? e.loc.join(".") : "?")}: ${e.message || e.msg}`)
      .join(" | ");
  }
  if (typeof body.detail === "string") return body.detail;
  return "erreur inconnue";
}

function flashCell(cell, state) {
  const el = cell.getElement();
  ["success", "error", "pending", "local"].forEach((s) => el.classList.remove(`cell-flash-${s}`));
  void el.offsetWidth;
  el.classList.add(`cell-flash-${state}`);
  setTimeout(() => el.classList.remove(`cell-flash-${state}`), 1200);
}

let toastTimer;
export function showToast(message, type = "info") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className = `toast toast-${type} visible`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 4000);
}
