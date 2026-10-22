"""SQLite connections, schema, and initial menu."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).with_name("cafe.db")
SEED_DRINKS = [
    (1, "Ca phe sua da", 29000, "coffee"),
    (2, "Ca phe den", 25000, "coffee"),
    (3, "Bac xiu", 32000, "coffee"),
    (4, "Tra dao cam sa", 35000, "tea"),
    (5, "Tra vai", 35000, "tea"),
    (6, "Tra matcha latte", 40000, "tea"),
    (7, "Sinh to bo", 45000, "smoothie"),
    (8, "Sinh to xoai", 42000, "smoothie"),
]


@contextmanager
def connect(db_path):
    connection = sqlite3.connect(db_path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialize_database(db_path):
    with connect(db_path) as db:
        # Serialize initialization and seed only when creating the drinks table.
        db.execute("BEGIN IMMEDIATE")
        first_run = db.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'drinks'"
        ).fetchone() is None
        db.execute("""
            CREATE TABLE IF NOT EXISTS drinks (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                price INTEGER NOT NULL CHECK (price >= 0),
                category TEXT NOT NULL CHECK (category IN ('coffee', 'tea', 'smoothie'))
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL CHECK (length(customer_name) BETWEEN 1 AND 50),
                total INTEGER NOT NULL CHECK (total >= 0),
                status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'done')),
                created_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL REFERENCES orders(id),
                drink_id INTEGER NOT NULL REFERENCES drinks(id),
                name TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
                unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)")
        if first_run:
            db.executemany("INSERT INTO drinks VALUES (?, ?, ?, ?)", SEED_DRINKS)
