import math

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from starlette.requests import Request

from .. import db
from ..query_params import parse_tabulator_params
from ..schemas import EmployeeUpdate
from ..sql_builder import build_order_by, build_where

router = APIRouter(prefix="/api/employees", tags=["employees-sqlite"])

DISTINCT_ALLOWED_FIELDS = {"department", "city", "country", "status", "job_title"}


@router.get("")
def list_employees(request: Request):
    """Source 'SQLite via backend' : tri, filtre, recherche globale et pagination
    sont tous evalues cote serveur, pour tenir sur un gros volume de donnees."""
    params = parse_tabulator_params(request)
    where_sql, where_params = build_where(params["filters"], params["q"])
    order_sql = build_order_by(params["sorters"])

    conn = db.get_connection()
    try:
        total = conn.execute(f"SELECT COUNT(*) FROM employees {where_sql}", where_params).fetchone()[0]
        last_page = max(math.ceil(total / params["size"]), 1)
        offset = (params["page"] - 1) * params["size"]

        rows = conn.execute(
            f"SELECT * FROM employees {where_sql} {order_sql} LIMIT ? OFFSET ?",
            [*where_params, params["size"], offset],
        ).fetchall()
    finally:
        conn.close()

    return {
        "data": [db.row_to_dict(r) for r in rows],
        "last_page": last_page,
        "total": total,
    }


@router.get("/distinct/{field}")
def distinct_values(field: str):
    if field not in DISTINCT_ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail=f"Champ non filtrable: {field}")

    conn = db.get_connection()
    try:
        rows = conn.execute(f"SELECT DISTINCT {field} FROM employees ORDER BY {field}").fetchall()
    finally:
        conn.close()
    return [r[0] for r in rows]


@router.patch("/{emp_id}")
def update_employee(emp_id: int, patch: dict):
    conn = db.get_connection()
    try:
        existing = conn.execute("SELECT * FROM employees WHERE id = ?", (emp_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Employe introuvable")

        try:
            update = EmployeeUpdate(**patch)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=_format_errors(exc)) from exc

        fields = update.model_dump(exclude_unset=True)
        if not fields:
            return db.row_to_dict(existing)

        if "email" in fields:
            dup = conn.execute(
                "SELECT id FROM employees WHERE email = ? AND id != ?", (fields["email"], emp_id)
            ).fetchone()
            if dup:
                raise HTTPException(
                    status_code=422,
                    detail=[{"field": "email", "message": "cette adresse email est deja utilisee"}],
                )

        db_fields = _serialize(fields)
        set_sql = ", ".join(f"{k} = ?" for k in db_fields)
        conn.execute(
            f"UPDATE employees SET {set_sql} WHERE id = ?",
            [*db_fields.values(), emp_id],
        )
        conn.commit()

        updated = conn.execute("SELECT * FROM employees WHERE id = ?", (emp_id,)).fetchone()
        return db.row_to_dict(updated)
    finally:
        conn.close()


def _serialize(fields: dict) -> dict:
    out = dict(fields)
    if "hire_date" in out and out["hire_date"] is not None:
        out["hire_date"] = out["hire_date"].isoformat()
    if "is_manager" in out and out["is_manager"] is not None:
        out["is_manager"] = int(out["is_manager"])
    return out


def _format_errors(exc: ValidationError):
    return [{"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"]} for e in exc.errors()]
