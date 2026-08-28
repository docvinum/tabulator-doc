from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from .. import store
from ..schemas import EmployeeUpdate

router = APIRouter(prefix="/api/employees-api", tags=["employees-api"])

DISTINCT_ALLOWED_FIELDS = {"department", "city", "country", "status", "job_title"}


@router.get("")
def list_employees():
    """Source 'API endpoint' generique : renvoie l'ensemble du jeu de donnees,
    les operations (tri/recherche/filtre) sont faites cote client par Tabulator."""
    return store.list_employees()


@router.get("/distinct/{field}")
def distinct_values(field: str):
    if field not in DISTINCT_ALLOWED_FIELDS:
        raise HTTPException(status_code=400, detail=f"Champ non filtrable: {field}")
    values = sorted({e[field] for e in store.list_employees()})
    return values


@router.patch("/{emp_id}")
def update_employee(emp_id: int, patch: dict):
    existing = store.get_employee(emp_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Employe introuvable")

    try:
        update = EmployeeUpdate(**patch)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=_format_errors(exc)) from exc

    fields = update.model_dump(exclude_unset=True)

    if "email" in fields and store.email_taken(fields["email"], exclude_id=emp_id):
        raise HTTPException(
            status_code=422,
            detail=[{"field": "email", "message": "cette adresse email est deja utilisee"}],
        )

    updated = store.update_employee(emp_id, _serialize(fields))
    return updated


def _serialize(fields: dict) -> dict:
    if "hire_date" in fields and fields["hire_date"] is not None:
        fields = {**fields, "hire_date": fields["hire_date"].isoformat()}
    return fields


def _format_errors(exc: ValidationError):
    return [{"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"]} for e in exc.errors()]
