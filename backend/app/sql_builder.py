"""Construction securisee (requetes parametrees) des clauses WHERE/ORDER BY SQLite
a partir des filtres/tris/recherche globale envoyes par Tabulator."""
from .schemas import QUERYABLE_FIELDS, SEARCHABLE_TEXT_FIELDS

NUMERIC_FIELDS = {"salary", "rating", "id"}
BOOLEAN_FIELDS = {"is_manager"}


def _cast(field: str, value):
    if field in NUMERIC_FIELDS:
        try:
            return float(value) if "." in str(value) else int(value)
        except (TypeError, ValueError):
            return value
    if field in BOOLEAN_FIELDS:
        return 1 if str(value).lower() in ("true", "1", "yes") else 0
    return value


def build_where(filters: list[dict], q: str) -> tuple[str, list]:
    clauses = []
    params: list = []

    for f in filters:
        field = f["field"]
        if field not in QUERYABLE_FIELDS:
            continue
        ftype = f.get("type", "=")
        value = f["value"]

        if ftype == "in":
            values = value if isinstance(value, list) else [value]
            values = [_cast(field, v) for v in values]
            if not values:
                continue
            placeholders = ",".join(["?"] * len(values))
            clauses.append(f"{field} IN ({placeholders})")
            params.extend(values)
        elif ftype in ("<", "<=", ">", ">="):
            clauses.append(f"{field} {ftype} ?")
            params.append(_cast(field, value))
        elif ftype == "!=":
            clauses.append(f"{field} != ?")
            params.append(_cast(field, value))
        elif ftype == "starts":
            clauses.append(f"LOWER({field}) LIKE LOWER(?)")
            params.append(f"{value}%")
        elif ftype == "ends":
            clauses.append(f"LOWER({field}) LIKE LOWER(?)")
            params.append(f"%{value}")
        elif ftype == "=" and field not in NUMERIC_FIELDS and field not in BOOLEAN_FIELDS:
            clauses.append(f"LOWER({field}) = LOWER(?)")
            params.append(value)
        elif ftype == "=":
            clauses.append(f"{field} = ?")
            params.append(_cast(field, value))
        else:  # "like", "keywords" ou type inconnu -> comportement "contient"
            clauses.append(f"LOWER({field}) LIKE LOWER(?)")
            params.append(f"%{value}%")

    if q:
        search_clauses = [f"LOWER({field}) LIKE LOWER(?)" for field in SEARCHABLE_TEXT_FIELDS]
        clauses.append("(" + " OR ".join(search_clauses) + ")")
        params.extend([f"%{q}%"] * len(SEARCHABLE_TEXT_FIELDS))

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return where_sql, params


def build_order_by(sorters: list[dict]) -> str:
    valid = [s for s in sorters if s["field"] in QUERYABLE_FIELDS and s["dir"] in ("asc", "desc")]
    if not valid:
        return "ORDER BY id ASC"
    parts = [f"{s['field']} {s['dir'].upper()}" for s in valid]
    return "ORDER BY " + ", ".join(parts)
