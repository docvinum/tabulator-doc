"""Store en memoire simulant un service API externe generique (source de donnees 'API').
Contrairement a la source SQLite, les donnees ne survivent pas a un redemarrage du serveur:
cela illustre une API classique de type CRUD, sans la couche de persistance disque."""
import threading

from .fake_data import generate_employees

API_DATASET_SIZE = 200

_lock = threading.Lock()
_employees: list[dict] = generate_employees(API_DATASET_SIZE, start_id=1)


def list_employees() -> list[dict]:
    with _lock:
        return [dict(e) for e in _employees]


def get_employee(emp_id: int) -> dict | None:
    with _lock:
        for e in _employees:
            if e["id"] == emp_id:
                return dict(e)
    return None


def update_employee(emp_id: int, fields: dict) -> dict | None:
    with _lock:
        for e in _employees:
            if e["id"] == emp_id:
                e.update(fields)
                return dict(e)
    return None


def email_taken(email: str, exclude_id: int | None = None) -> bool:
    with _lock:
        return any(e["email"] == email and e["id"] != exclude_id for e in _employees)
