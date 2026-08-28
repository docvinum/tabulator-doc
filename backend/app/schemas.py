from datetime import date

from pydantic import BaseModel, EmailStr, Field, field_validator

from .fake_data import DEPARTMENTS, STATUSES

EDITABLE_FIELDS = {
    "first_name", "last_name", "email", "department", "job_title",
    "city", "country", "salary", "status", "hire_date", "is_manager", "rating",
}

# Colonnes sur lesquelles le tri/filtre/recherche serveur est autorise (whitelist anti-injection)
QUERYABLE_FIELDS = EDITABLE_FIELDS | {"id"}

SEARCHABLE_TEXT_FIELDS = [
    "first_name", "last_name", "email", "department", "job_title", "city", "country", "status",
]


class Employee(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    job_title: str
    city: str
    country: str
    salary: int
    status: str
    hire_date: date
    is_manager: bool
    rating: int


class EmployeeUpdate(BaseModel):
    model_config = {"extra": "forbid"}

    first_name: str | None = Field(default=None, min_length=1, max_length=60)
    last_name: str | None = Field(default=None, min_length=1, max_length=60)
    email: EmailStr | None = None
    department: str | None = None
    job_title: str | None = Field(default=None, min_length=1, max_length=80)
    city: str | None = Field(default=None, min_length=1, max_length=80)
    country: str | None = Field(default=None, min_length=1, max_length=80)
    salary: int | None = Field(default=None, gt=0, le=500_000)
    status: str | None = None
    hire_date: date | None = None
    is_manager: bool | None = None
    rating: int | None = Field(default=None, ge=1, le=5)

    @field_validator("department")
    @classmethod
    def check_department(cls, v):
        if v is not None and v not in DEPARTMENTS:
            raise ValueError(f"departement invalide, valeurs autorisees: {', '.join(DEPARTMENTS)}")
        return v

    @field_validator("status")
    @classmethod
    def check_status(cls, v):
        if v is not None and v not in STATUSES:
            raise ValueError(f"statut invalide, valeurs autorisees: {', '.join(STATUSES)}")
        return v

    @field_validator("hire_date")
    @classmethod
    def check_hire_date(cls, v):
        if v is not None and v > date.today():
            raise ValueError("la date d'embauche ne peut pas etre dans le futur")
        return v
