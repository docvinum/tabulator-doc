import sqlite3
from pathlib import Path

from .fake_data import generate_employees

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "app.db"
LARGE_DATASET_SIZE = 5000

SCHEMA = """
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    job_title TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    salary INTEGER NOT NULL,
    status TEXT NOT NULL,
    hire_date TEXT NOT NULL,
    is_manager INTEGER NOT NULL,
    rating INTEGER NOT NULL
);
"""


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_connection()
    try:
        conn.execute(SCHEMA)
        conn.commit()
        count = conn.execute("SELECT COUNT(*) FROM employees").fetchone()[0]
        if count == 0:
            rows = generate_employees(LARGE_DATASET_SIZE, start_id=1)
            conn.executemany(
                """INSERT INTO employees
                (id, first_name, last_name, email, department, job_title, city, country,
                 salary, status, hire_date, is_manager, rating)
                VALUES (:id, :first_name, :last_name, :email, :department, :job_title, :city, :country,
                        :salary, :status, :hire_date, :is_manager, :rating)""",
                [{**r, "is_manager": int(r["is_manager"])} for r in rows],
            )
            conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["is_manager"] = bool(d["is_manager"])
    return d
