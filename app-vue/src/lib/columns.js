import { DEPARTMENTS, STATUSES } from "./constants.js";

const EMAIL_REGEX_SRC = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const DATE_REGEX_SRC = "^\\d{4}-\\d{2}-\\d{2}$";

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
      headerFilter: "input", headerFilterFunc: "like",
    },
    {
      title: "Nom", field: "last_name", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:60"],
      headerFilter: "input", headerFilterFunc: "like",
    },
    {
      title: "Email", field: "email", width: 240, editor: editable ? "input" : false,
      validator: ["required", { type: "regex", parameters: EMAIL_REGEX_SRC }],
      headerFilter: "input", headerFilterFunc: "like",
    },
    {
      title: "Departement", field: "department",
      editor: editable ? "list" : false,
      editorParams: { values: DEPARTMENTS },
      validator: ["required", { type: "in", parameters: DEPARTMENTS }],
      headerFilter: "list",
      headerFilterParams: { values: distinct.department || DEPARTMENTS, multiselect: true, clearable: true },
      headerFilterFunc: "in",
      headerFilterLiveFilter: false,
    },
    {
      title: "Poste", field: "job_title", width: 180, editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:80"],
      headerFilter: "input", headerFilterFunc: "like",
    },
    {
      title: "Ville", field: "city", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:80"],
      headerFilter: "list",
      headerFilterParams: { values: distinct.city || [], multiselect: true, clearable: true },
      headerFilterFunc: "in",
      headerFilterLiveFilter: false,
    },
    {
      title: "Pays", field: "country", editor: editable ? "input" : false,
      validator: ["required", "string", "minLength:1", "maxLength:80"],
      headerFilter: "list",
      headerFilterParams: { values: distinct.country || [], multiselect: true, clearable: true },
      headerFilterFunc: "in",
      headerFilterLiveFilter: false,
    },
    {
      title: "Salaire", field: "salary", hozAlign: "right", sorter: "number",
      editor: editable ? "number" : false,
      editorParams: { min: 1, max: 500000, step: 500 },
      validator: ["required", "integer", "min:1", "max:500000"],
      formatter: (cell) => Number(cell.getValue() || 0).toLocaleString("fr-FR") + " EUR",
      headerFilter: "number", headerFilterFunc: ">=", headerFilterPlaceholder: "salaire >=",
    },
    {
      title: "Statut", field: "status",
      editor: editable ? "list" : false,
      editorParams: { values: STATUSES },
      validator: ["required", { type: "in", parameters: STATUSES }],
      headerFilter: "list",
      headerFilterParams: { values: distinct.status || STATUSES, multiselect: true, clearable: true },
      headerFilterFunc: "in",
      headerFilterLiveFilter: false,
    },
    {
      title: "Embauche", field: "hire_date", sorter: "string",
      editor: editable ? "date" : false,
      validator: [
        "required",
        { type: "regex", parameters: DATE_REGEX_SRC },
        (cell, value) => value <= new Date().toISOString().slice(0, 10),
      ],
      headerFilter: "date", headerFilterFunc: ">=", headerFilterPlaceholder: "embauche(e) apres le",
    },
    {
      title: "Manager", field: "is_manager", hozAlign: "center", width: 100,
      editor: editable ? "tickCross" : false,
      formatter: "tickCross",
      headerFilter: "tickCross", headerFilterParams: { tristate: true },
    },
    {
      title: "Note", field: "rating", hozAlign: "center", width: 90, sorter: "number",
      editor: editable ? "number" : false,
      editorParams: { min: 1, max: 5, step: 1 },
      validator: ["required", "integer", "min:1", "max:5"],
      headerFilter: "number", headerFilterFunc: ">=", headerFilterPlaceholder: "note >=",
    },
  ];
}
