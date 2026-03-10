"""
notify_reminders.py — Sends booking reminder notifications.
Intended to run on a cron schedule (e.g. every 15 minutes).
Run: python scripts/notify_reminders.py
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]


def main() -> None:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # TODO: query upcoming bookings within reminder window, send notifications
    print("Sending reminders… (not yet implemented)")

    conn.commit()
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
