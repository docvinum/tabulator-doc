"""Génération de données factices (employés) partagée par les 3 sources de la démo."""
import random
from datetime import date, timedelta

from faker import Faker

fake = Faker("fr_FR")

DEPARTMENTS = ["Ingenierie", "Ventes", "Marketing", "RH", "Finance", "Support", "Operations", "Juridique"]

JOB_TITLES = {
    "Ingenierie": ["Ingenieur Logiciel", "Ingenieur QA", "Lead Technique", "DevOps", "Architecte"],
    "Ventes": ["Commercial", "Account Manager", "Responsable Ventes", "SDR"],
    "Marketing": ["Chef de Produit", "Growth Marketer", "Content Manager", "Responsable Marketing"],
    "RH": ["Charge de Recrutement", "Responsable RH", "Gestionnaire de Paie"],
    "Finance": ["Comptable", "Controleur de Gestion", "Analyste Financier"],
    "Support": ["Support Technique", "Responsable Support", "Support Client"],
    "Operations": ["Chef de Projet", "Responsable Operations", "Analyste Operations"],
    "Juridique": ["Juriste", "Responsable Conformite"],
}

CITIES_COUNTRIES = [
    ("Paris", "France"), ("Lyon", "France"), ("Marseille", "France"), ("Bordeaux", "France"),
    ("Lille", "France"), ("Nantes", "France"), ("Toulouse", "France"), ("Strasbourg", "France"),
    ("Berlin", "Allemagne"), ("Munich", "Allemagne"), ("Madrid", "Espagne"), ("Barcelone", "Espagne"),
    ("Milan", "Italie"), ("Rome", "Italie"), ("Londres", "Royaume-Uni"), ("Amsterdam", "Pays-Bas"),
    ("Bruxelles", "Belgique"), ("Geneve", "Suisse"), ("Dublin", "Irlande"), ("Lisbonne", "Portugal"),
]

STATUSES = ["Actif", "Conge", "Termine"]
STATUS_WEIGHTS = [0.82, 0.1, 0.08]


def _slugify(value: str) -> str:
    replacements = str.maketrans("éèêëàâäîïôöùûüç", "eeeeaaaiioouuuc")
    return value.lower().translate(replacements).replace(" ", "").replace("-", "")


def generate_employee(emp_id: int, used_emails: set) -> dict:
    first_name = fake.first_name()
    last_name = fake.last_name()
    department = random.choice(DEPARTMENTS)
    job_title = random.choice(JOB_TITLES[department])
    city, country = random.choice(CITIES_COUNTRIES)
    status = random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0]

    base_email = f"{_slugify(first_name)}.{_slugify(last_name)}@acme-corp.example"
    email = base_email
    suffix = 1
    while email in used_emails:
        suffix += 1
        email = f"{_slugify(first_name)}.{_slugify(last_name)}{suffix}@acme-corp.example"
    used_emails.add(email)

    hire_date = fake.date_between(start_date=date(2010, 1, 1), end_date=date.today())
    seniority_years = max(0, (date.today() - hire_date).days // 365)
    base_salary = random.randint(28000, 65000) + seniority_years * random.randint(500, 1500)
    salary = min(base_salary, 145000)

    return {
        "id": emp_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "department": department,
        "job_title": job_title,
        "city": city,
        "country": country,
        "salary": salary,
        "status": status,
        "hire_date": hire_date.isoformat(),
        "is_manager": random.random() < 0.15,
        "rating": random.randint(1, 5),
    }


def generate_employees(count: int, start_id: int = 1) -> list[dict]:
    used_emails: set[str] = set()
    return [generate_employee(start_id + i, used_emails) for i in range(count)]
