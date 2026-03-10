"""
import_data.py — Bulk data import utility.
Reads a CSV / JSON source and upserts records via the internal API or directly into Postgres.
Run: python scripts/import_data.py --file <path>
"""

import argparse
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_BASE = os.environ.get("NEXTAUTH_URL", "http://localhost:3000")


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk import data into omni-book")
    parser.add_argument("--file", required=True, help="Path to the input file (CSV or JSON)")
    args = parser.parse_args()

    # TODO: parse file, POST records to API
    print(f"Importing from {args.file}… (not yet implemented)")


if __name__ == "__main__":
    main()
