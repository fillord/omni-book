"""
seed_tenants.py — Seeds demo tenants and their resources directly into Postgres.
Run: python scripts/seed_tenants.py
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]


def main() -> None:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # TODO: insert demo Tenant rows, Resources, Services
    print("Seeding demo tenants… (not yet implemented)")

    conn.commit()
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
