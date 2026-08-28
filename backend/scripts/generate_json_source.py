"""Genere le fichier JSON statique utilise par la source 'JSON local' des 2 demos.
Usage: python -m scripts.generate_json_source
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.fake_data import generate_employees  # noqa: E402

JSON_SOURCE_SIZE = 60

OUTPUT_PATHS = [
    Path(__file__).resolve().parent.parent.parent / "demo-vanilla" / "data" / "employees.json",
    Path(__file__).resolve().parent.parent.parent / "app-vue" / "public" / "data" / "employees.json",
]


def main():
    employees = generate_employees(JSON_SOURCE_SIZE, start_id=1)
    payload = json.dumps(employees, ensure_ascii=False, indent=2)

    for path in OUTPUT_PATHS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(payload + "\n", encoding="utf-8")
        print(f"Ecrit: {path}")


if __name__ == "__main__":
    main()
