/**
 * Filtres d'en-tete (`tabulator-header-filter`) sur mesure.
 *
 * Pourquoi ne pas utiliser les editeurs livres avec Tabulator ?
 *  - l'editeur "list" en `multiselect` n'affiche pas lisiblement la selection et
 *    ne se ferme jamais : chaque clic ajoute/retire une valeur, ce qui oblige a
 *    cliquer ailleurs pour valider un simple choix unique ;
 *  - les editeurs "input"/"number"/"date" n'offrent pas de bouton d'effacement
 *    homogene (Tabulator bascule les champs texte en `type=search`, dont la
 *    croix native n'existe que sur les navigateurs WebKit) ;
 *  - Tabulator n'arrete la propagation du `mousedown` que si
 *    `headerFilterLiveFilter` est actif, si bien qu'un clic dans le filtre peut
 *    declencher la selection de colonne du module SelectRange.
 *
 * Contrat attendu par le module Filter de Tabulator pour un editeur d'en-tete :
 * l'editeur renvoie un Node dont la propriete `value` porte la valeur du filtre.
 * Les composants ci-dessous renvoient donc un `<div>` conteneur sur lequel
 * `value` est redefini (get/set) pour deleguer au champ reel qu'il enveloppe.
 */

const CLEAR_LABEL = "Effacer le filtre";
const MULTI_HINT = "Maj + clic : selection multiple";

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function makeClearButton(onClear) {
  const btn = el("button", "thf-clear");
  btn.type = "button";
  btn.tabIndex = -1;
  btn.title = CLEAR_LABEL;
  btn.setAttribute("aria-label", CLEAR_LABEL);
  btn.textContent = "×";
  btn.hidden = true;
  // `mousedown` par defaut deplacerait le focus (et, sur un filtre liste,
  // fermerait le popup avant que le `click` n'arrive).
  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClear();
  });
  return btn;
}

/** Conteneur commun : neutralise le mousedown pour ne pas selectionner la colonne. */
function makeShell(extraClass) {
  const wrap = el("div", `thf ${extraClass}`);
  wrap.addEventListener("mousedown", (e) => e.stopPropagation());
  return wrap;
}

function definePassthroughValue(wrap, get, set) {
  Object.defineProperty(wrap, "value", { get, set, configurable: true });
}

/* ------------------------------------------------------------------ */
/* Filtres texte / nombre / date                                       */
/* ------------------------------------------------------------------ */

/**
 * Fabrique un filtre d'en-tete a champ unique, dote d'un bouton d'effacement.
 * @param {"text"|"number"|"date"} inputType
 */
export function makeInputHeaderFilter(inputType = "text") {
  return function inputHeaderFilter(cell, onRendered, success, cancel, params = {}) {
    const def = cell.getColumn().getDefinition();
    const wrap = makeShell("thf-input");
    const input = el("input", "thf-field");

    input.type = inputType;
    input.setAttribute("aria-label", `Filtrer la colonne ${def.title}`);
    if (def.headerFilterPlaceholder) input.placeholder = def.headerFilterPlaceholder;
    ["min", "max", "step"].forEach((attr) => {
      if (params[attr] !== undefined) input.setAttribute(attr, params[attr]);
    });

    const initial = cell.getValue();
    input.value = initial === undefined || initial === null ? "" : initial;

    const clear = makeClearButton(() => {
      input.value = "";
      syncState();
      success("");
      input.focus();
    });

    function syncState() {
      const filled = input.value !== "";
      clear.hidden = !filled;
      wrap.classList.toggle("is-active", filled);
    }

    // Tabulator ecoute deja `keyup` (filtrage a la volee). On ajoute `input`
    // pour couvrir le collage a la souris et `change` pour les fleches du champ
    // nombre et le selecteur de date, qui n'emettent aucune touche.
    input.addEventListener("input", syncState);
    input.addEventListener("change", () => {
      syncState();
      success(input.value);
    });

    definePassthroughValue(
      wrap,
      () => input.value,
      (v) => {
        input.value = v === undefined || v === null ? "" : v;
        syncState();
      }
    );
    wrap.focus = () => input.focus();

    wrap.append(input, clear);
    syncState();
    return wrap;
  };
}

export const inputHeaderFilter = makeInputHeaderFilter("text");
export const numberHeaderFilter = makeInputHeaderFilter("number");
export const dateHeaderFilter = makeInputHeaderFilter("date");

/* ------------------------------------------------------------------ */
/* Filtre liste multi-selection                                        */
/* ------------------------------------------------------------------ */

function normalizeOptions(raw) {
  const values = typeof raw === "function" ? raw() : raw;
  if (!Array.isArray(values)) return [];
  return values.map((v) =>
    v !== null && typeof v === "object"
      ? { value: v.value, label: String(v.label ?? v.value) }
      : { value: v, label: String(v) }
  );
}

function toSelection(value) {
  if (Array.isArray(value)) return value.slice();
  if (value === undefined || value === null || value === "") return [];
  return String(value).split(",").filter((v) => v !== "");
}

/**
 * Filtre d'en-tete "liste" multi-selection.
 *
 * Interaction (c'est la difference avec l'editeur `list` de Tabulator) :
 *  - clic simple  -> remplace la selection par la valeur cliquee et ferme la liste
 *                    (recliquer la valeur deja seule selectionnee l'enleve) ;
 *  - Maj/Ctrl+clic -> ajoute ou retire la valeur et garde la liste ouverte.
 *
 * La valeur renvoyee est un tableau (a utiliser avec `headerFilterFunc: "in"`),
 * ou "" quand rien n'est selectionne pour que Tabulator retire le filtre.
 */
export function listHeaderFilter(cell, onRendered, success, cancel, params = {}) {
  const def = cell.getColumn().getDefinition();
  const options = normalizeOptions(params.values);
  const placeholder = def.headerFilterPlaceholder || "Toutes";

  let selected = toSelection(cell.getValue());
  let popup = null;
  let focusIndex = -1;

  const wrap = makeShell("thf-list");
  const field = el("button", "thf-field thf-list-field");
  field.type = "button";
  field.setAttribute("aria-haspopup", "listbox");
  field.setAttribute("aria-expanded", "false");
  field.setAttribute("aria-label", `Filtrer la colonne ${def.title}`);

  // Le compteur est un element a part : quand la colonne est trop etroite,
  // c'est le libelle qui est tronque, le nombre reste toujours lisible.
  const badge = el("span", "thf-count");
  const text = el("span", "thf-list-text");
  field.append(badge, text);

  const clear = makeClearButton(() => {
    selected = [];
    render();
    success("");
    closePopup();
  });

  wrap.append(field, clear);

  function labelFor(value) {
    const found = options.find((o) => String(o.value) === String(value));
    return found ? found.label : String(value);
  }

  function render() {
    badge.hidden = selected.length < 2;
    if (badge.hidden) badge.textContent = "";
    if (!selected.length) {
      text.textContent = placeholder;
      field.removeAttribute("title");
    } else if (selected.length === 1) {
      text.textContent = labelFor(selected[0]);
      field.title = text.textContent;
    } else {
      // Le compteur reste visible meme quand la colonne est trop etroite pour
      // afficher la liste des valeurs ; l'infobulle la donne en entier.
      const labels = selected.map(labelFor).join(", ");
      badge.textContent = String(selected.length);
      text.textContent = labels;
      field.title = labels;
    }
    field.classList.toggle("is-empty", selected.length === 0);
    clear.hidden = selected.length === 0;
    wrap.classList.toggle("is-active", selected.length > 0);
    if (popup) syncOptions();
  }

  function apply() {
    success(selected.length ? selected.slice() : "");
  }

  function isSelected(value) {
    return selected.some((v) => String(v) === String(value));
  }

  function choose(index, additive) {
    const option = options[index];
    if (!option) return;
    focusIndex = index;

    if (additive) {
      const at = selected.findIndex((v) => String(v) === String(option.value));
      if (at > -1) selected.splice(at, 1);
      else selected.push(option.value);
      render();
      apply();
      return; // la liste reste ouverte pour enchainer les choix
    }

    const alreadyOnlyChoice = selected.length === 1 && isSelected(option.value);
    selected = alreadyOnlyChoice ? [] : [option.value];
    render();
    apply();
    closePopup();
    field.focus();
  }

  function syncOptions() {
    if (!popup) return;
    popup.querySelectorAll(".thf-option").forEach((item, idx) => {
      item.classList.toggle("is-selected", isSelected(options[idx].value));
      item.classList.toggle("is-focused", idx === focusIndex);
      item.setAttribute("aria-selected", isSelected(options[idx].value) ? "true" : "false");
    });
  }

  function position() {
    if (!popup) return;
    const rect = wrap.getBoundingClientRect();
    popup.style.minWidth = `${Math.max(rect.width, 150)}px`;

    // Mesure apres avoir fige la largeur : la hauteur depend du retour a la ligne.
    const { offsetWidth: width, offsetHeight: height } = popup;
    const below = window.innerHeight - rect.bottom;
    const openUp = below < height + 8 && rect.top > below;

    popup.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - width - 4))}px`;
    popup.style.top = openUp ? `${rect.top - height - 4}px` : `${rect.bottom + 4}px`;
  }

  function onDocumentMouseDown(e) {
    if (!popup) return;
    if (popup.contains(e.target) || wrap.contains(e.target)) return;
    closePopup();
  }

  function onViewportChange(e) {
    if (!popup) return;
    // Le defilement interne du popup ne doit pas le deplacer.
    if (e && e.target instanceof Node && popup.contains(e.target)) return;

    // Recharger les donnees (mode serveur) fait defiler le corps du tableau et
    // emet donc un evenement scroll : on repositionne plutot que de fermer,
    // sinon chaque Maj+clic refermerait la liste.
    if (!wrap.isConnected) {
      closePopup();
      return;
    }
    const rect = wrap.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) closePopup();
    else position();
  }

  function openPopup() {
    if (popup) return;

    popup = el("div", "thf-popup");
    popup.setAttribute("role", "listbox");
    popup.setAttribute("aria-multiselectable", "true");

    if (!options.length) {
      const empty = el("div", "thf-popup-empty");
      empty.textContent = "Aucune valeur";
      popup.appendChild(empty);
    } else {
      const hint = el("div", "thf-popup-hint");
      hint.textContent = MULTI_HINT;
      popup.appendChild(hint);

      const list = el("div", "thf-popup-list");
      options.forEach((option, idx) => {
        const item = el("div", "thf-option");
        item.setAttribute("role", "option");
        const box = el("span", "thf-option-box");
        const label = el("span", "thf-option-label");
        label.textContent = option.label;
        item.append(box, label);
        item.addEventListener("mousedown", (e) => e.preventDefault());
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          choose(idx, e.shiftKey || e.ctrlKey || e.metaKey);
        });
        list.appendChild(item);
      });
      popup.appendChild(list);
    }

    document.body.appendChild(popup);
    // La navigation clavier repart de la premiere valeur deja cochee (-1 sinon).
    focusIndex = options.findIndex((o) => isSelected(o.value));
    position();
    syncOptions();

    wrap.classList.add("is-open");
    field.setAttribute("aria-expanded", "true");

    document.addEventListener("mousedown", onDocumentMouseDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
  }

  function closePopup() {
    if (!popup) return;
    document.removeEventListener("mousedown", onDocumentMouseDown, true);
    window.removeEventListener("resize", onViewportChange);
    window.removeEventListener("scroll", onViewportChange, true);
    popup.remove();
    popup = null;
    focusIndex = -1;
    wrap.classList.remove("is-open");
    field.setAttribute("aria-expanded", "false");
  }

  function moveFocus(delta) {
    if (!options.length) return;
    focusIndex = (focusIndex + delta + options.length) % options.length;
    syncOptions();
    const item = popup && popup.querySelectorAll(".thf-option")[focusIndex];
    if (item) item.scrollIntoView({ block: "nearest" });
  }

  field.addEventListener("click", (e) => {
    e.stopPropagation();
    if (popup) closePopup();
    else openPopup();
  });

  field.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!popup) openPopup();
        else moveFocus(e.key === "ArrowDown" ? 1 : -1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!popup) openPopup();
        else if (focusIndex > -1) choose(focusIndex, e.shiftKey || e.ctrlKey || e.metaKey);
        break;
      case "Escape":
        if (popup) {
          e.preventDefault();
          e.stopPropagation();
          closePopup();
        }
        break;
      default:
        break;
    }
  });

  definePassthroughValue(
    wrap,
    () => (selected.length ? selected.slice() : ""),
    (v) => {
      selected = toSelection(v);
      render();
    }
  );
  wrap.focus = () => field.focus();

  // Tabulator regenere l'en-tete (deplacement de colonne, setHeaderFilterValue...)
  // en retirant le `.tabulator-header-filter` de la cellule d'en-tete : on
  // surveille ce parent pour ne pas laisser un popup orpheline dans <body>.
  onRendered(() => {
    const headerCell = wrap.parentNode && wrap.parentNode.parentNode;
    if (!headerCell) return;
    const observer = new MutationObserver(() => {
      if (!wrap.isConnected) {
        closePopup();
        observer.disconnect();
      }
    });
    observer.observe(headerCell, { childList: true });
  });

  render();
  return wrap;
}
