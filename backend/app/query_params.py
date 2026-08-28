"""Parsing des parametres de requete au format envoye par Tabulator en mode remote
(page, size, sort[0][field], sort[0][dir], filter[0][field], filter[0][type], filter[0][value], q).
"""
import re
from collections import defaultdict

from starlette.requests import Request

from .schemas import QUERYABLE_FIELDS

_KEY_RE = re.compile(r"^(sort|filter)\[(\d+)\]\[(field|dir|type|value)\](?:\[(\d+)\])?$")


def parse_tabulator_params(request: Request) -> dict:
    page = int(request.query_params.get("page", 1) or 1)
    size = int(request.query_params.get("size", 50) or 50)
    q = request.query_params.get("q", "").strip()

    sorters_by_index: dict[int, dict] = defaultdict(dict)
    filters_by_index: dict[int, dict] = defaultdict(dict)

    for key, value in request.query_params.multi_items():
        match = _KEY_RE.match(key)
        if not match:
            continue
        kind, index, prop, sub_index = match.group(1), int(match.group(2)), match.group(3), match.group(4)
        target = sorters_by_index if kind == "sort" else filters_by_index

        if sub_index is not None:
            # valeur multiple (filtre "in" sur une liste de valeurs distinctes)
            existing = target[index].get(prop)
            if not isinstance(existing, list):
                existing = []
                target[index][prop] = existing
            existing.append(value)
        else:
            target[index][prop] = value

    sorters = [
        s for _, s in sorted(sorters_by_index.items())
        if s.get("field") in QUERYABLE_FIELDS and s.get("dir") in ("asc", "desc")
    ]

    filters = []
    for _, f in sorted(filters_by_index.items()):
        field = f.get("field")
        if field not in QUERYABLE_FIELDS or "value" not in f:
            continue
        filters.append({"field": field, "type": f.get("type", "="), "value": f["value"]})

    page = max(page, 1)
    size = max(min(size, 500), 1)

    return {"page": page, "size": size, "q": q, "sorters": sorters, "filters": filters}
