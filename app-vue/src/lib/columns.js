import { DEPARTMENTS, STATUSES } from "./constants.js";
import {
  inputHeaderFilter,
  numberHeaderFilter,
  dateHeaderFilter,
  listHeaderFilter,
  booleanHeaderFilter,
} from "./headerFilters.js";

const EMAIL_REGEX_SRC = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const DATE_REGEX_SRC = "^\\d{4}-\\d{2}-\\d{2}$";

/**
 * Colonne categorielle : filtre d'en-tete multi-selection (Maj+clic) base sur
 * les valeurs distinctes de la source, avec le filtre "in" cote client comme
 * cote serveur (voir backend/app/sql_builder.py).
 */
function listColumn(values, placeholder) {
  return {
    headerFilter: listHeaderFilter,
    headerFilterParams: { values },
    headerFilterFunc: "in",
    headerFilterPlaceholder: placeholder,
  };
}

/**
 * Construit la definition de colonnes Tabulator pour le jeu de donnees "employes".
 * @param {object} distinct - valeurs distinctes par colonne categorielle: {department, city, country, status}
 * @param {object} opts - {editable: boolean}
 */
export function buildColumns(distinct = {}, opts = {}) {
  const editable = opts.editable !== false;

  return [
    { title: "ID", field: "id", width: 70, sorter: "number", headerFilter: false },
    {
      title: "Prenom", field: "first_name", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:60"],
      headerFilter: inputHeaderFilter, headerFilterFunc: "like",
    },
    {
      title: "Nom", field: "last_name", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:60"],
      headerFilter: inputHeaderFilter, headerFilterFunc: "like",
    },
    {
      title: "Email", field: "email", width: 240, editor: editable ? "input" : false,
      validator: ["required", { type: "regex", parameters: EMAIL_REGEX_SRC }],
      headerFilter: inputHeaderFilter, headerFilterFunc: "like",
    },
    {
      title: "Departement", field: "department",
      editor: editable ? "list" : false,
      editorParams: { values: DEPARTMENTS },
      validator: ["required", { type: "in", parameters: DEPARTMENTS }],
      ...listColumn(distinct.department || DEPARTMENTS, "Tous"),
    },
    {
      title: "Poste", field: "job_title", width: 180, editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:80"],
      headerFilter: inputHeaderFilter, headerFilterFunc: "like",
    },
    {
      title: "Ville", field: "city", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:80"],
      ...listColumn(distinct.city || [], "Toutes"),
    },
    {
      title: "Pays", field: "country", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:80"],
      ...listColumn(distinct.country || [], "Tous"),
    },
    {
      title: "Salaire", field: "salary", hozAlign: "right", sorter: "number",
      editor: editable ? "number" : false,
      editorParams: { min: 1, max: 500000, step: 500 },
      validator: ["required", "integer", "min:1", "max:500000"],
      formatter: (cell) => Number(cell.getValue() || 0).toLocaleString("fr-FR") + " EUR",
      headerFilter: numberHeaderFilter, headerFilterFunc: ">=", headerFilterPlaceholder: "min.",
    },
    {
      title: "Statut", field: "status",
      editor: editable ? "list" : false,
      editorParams: { values: STATUSES },
      validator: ["required", { type: "in", parameters: STATUSES }],
      ...listColumn(distinct.status || STATUSES, "Tous"),
    },
    {
      title: "Embauche", field: "hire_date", sorter: "string",
      editor: editable ? "date" : false,
      validator: [
        "required",
        { type: "regex", parameters: DATE_REGEX_SRC },
        (cell, value) => value <= new Date().toISOString().slice(0, 10),
      ],
      headerFilter: dateHeaderFilter, headerFilterFunc: ">=", headerFilterPlaceholder: "apres le",
    },
    {
      title: "Manager", field: "is_manager", hozAlign: "center", width: 100,
      editor: editable ? "tickCross" : false,
      formatter: "tickCross",
      headerFilter: booleanHeaderFilter,
      // Un editeur d'en-tete fourni en fonction (plutot que la chaine
      // "tickCross") n'herite pas du garde-fou que Tabulator applique
      // lui-meme dans ce cas precis : sans lui, `false` (falsy) serait a
      // tort traite comme "filtre vide" par le detecteur par defaut.
      headerFilterEmptyCheck: (value) => value !== true && value !== false,
    },
    {
      title: "Note", field: "rating", hozAlign: "center", width: 90, sorter: "number",
      editor: editable ? "number" : false,
      editorParams: { min: 1, max: 5, step: 1 },
      validator: ["required", "integer", "min:1", "max:5"],
      headerFilter: numberHeaderFilter, headerFilterFunc: ">=", headerFilterPlaceholder: "min.",
    },
  ];
}
