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

/* ------------------------------------------------------------------ */
/* Filtre booleen tristate (Manager) : meme badge que les cellules      */
/* ------------------------------------------------------------------ */

// Glyphes repris tels quels du formateur "tickCross" natif de Tabulator, pour
// que le badge du filtre soit visuellement identique a celui des cellules
// (memes classes tabulator-tick/tabulator-cross, meme tracé) plutot qu'une
// approximation dessinee en CSS.
const TICK_SVG =
  '<svg viewBox="0 0 24 24"><path class="tabulator-tick" fill-rule="evenodd" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z"/></svg>';
const CROSS_SVG =
  '<svg viewBox="0 0 24 24"><path class="tabulator-cross" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';

// L'ordre reproduit le cycle de l'editeur tickCross natif de Tabulator :
// indetermine (pas de filtre) -> coche -> decoche -> indetermine...
const BOOL_STATES = [
  { value: "", label: "Tous", cls: "is-neutral" },
  { value: true, label: "Oui", cls: "is-true" },
  { value: false, label: "Non", cls: "is-false" },
];

/**
 * Filtre d'en-tete tristate pour une colonne booleenne (ex. `is_manager`).
 * Le badge reprend exactement le style des cellules formatees en
 * "tickCross" : disque plein vert pour "oui", anneau gris pour "non" (voir
 * la regle CSS `.tabulator-cell[tabulator-field="..."][aria-checked]`) ;
 * l'etat neutre ("Tous") est un cercle vide pour rester visuellement
 * distinct des deux autres. A utiliser avec `headerFilterEmptyCheck: (v) =>
 * v !== true && v !== false` (Tabulator applique ce garde-fou lui-meme pour
 * la chaine `"tickCross"`, mais pas pour un editeur fourni en fonction --
 * sans lui, la valeur `false`, falsy, serait a tort traitee comme "filtre
 * vide" par le detecteur par defaut).
 */
export function booleanHeaderFilter(cell, onRendered, success, cancel, params = {}) {
  const def = cell.getColumn().getDefinition();
  const initial = cell.getValue();
  let stateIndex = BOOL_STATES.findIndex((s) => s.value === initial);
  if (stateIndex === -1) stateIndex = 0;

  const wrap = makeShell("thf-bool");
  const field = el("button", "thf-bool-field");
  field.type = "button";
  field.setAttribute("aria-label", `Filtrer la colonne ${def.title}`);

  const badge = el("span", "thf-bool-badge");
  field.appendChild(badge);
  wrap.appendChild(field);

  function render() {
    const state = BOOL_STATES[stateIndex];
    badge.className = `thf-bool-badge ${state.cls}`;
    badge.innerHTML = state.value === true ? TICK_SVG : state.value === false ? CROSS_SVG : "";
    field.title = `${def.title} : ${state.label} (cliquer pour changer)`;
    wrap.classList.toggle("is-active", state.value !== "");
  }

  field.addEventListener("click", (e) => {
    e.stopPropagation();
    stateIndex = (stateIndex + 1) % BOOL_STATES.length;
    render();
    success(BOOL_STATES[stateIndex].value);
  });

  definePassthroughValue(
    wrap,
    () => BOOL_STATES[stateIndex].value,
    (v) => {
      const idx = BOOL_STATES.findIndex((s) => s.value === v);
      stateIndex = idx === -1 ? 0 : idx;
      render();
    }
  );
  wrap.focus = () => field.focus();

  render();
  return wrap;
}
