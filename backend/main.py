"""Cafe ordering API. Run with uvicorn main:app --reload --port 8000."""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import DEFAULT_DB_PATH, connect, initialize_database
from schemas import Drink, Order, OrderCreate, StatusUpdate


def read_order(db, order_id):
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Order not found")
    order = dict(row)
    order["items"] = [dict(item) for item in db.execute(
        "SELECT drink_id, name, quantity, unit_price FROM order_items "
        "WHERE order_id = ? ORDER BY id", (order_id,)
    )]
    return order


def create_app(db_path=DEFAULT_DB_PATH):
    @asynccontextmanager
    async def lifespan(app):
        initialize_database(db_path)
        yield

    app = FastAPI(title="Cafe Order", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/menu", response_model=list[Drink])
    def get_menu():
        with connect(db_path) as db:
            return [dict(row) for row in db.execute("SELECT * FROM drinks ORDER BY id")]

    @app.post("/api/orders", response_model=Order, status_code=201)
    def create_order(body: OrderCreate):
        with connect(db_path) as db:
            db.execute("BEGIN IMMEDIATE")
            items = []
            for item in body.items:
                drink = db.execute("SELECT * FROM drinks WHERE id = ?", (item.drink_id,)).fetchone()
                if drink is None:
                    raise HTTPException(status_code=400, detail="Drink not found")
                items.append((item.drink_id, drink["name"], item.quantity, drink["price"]))
            total = sum(quantity * price for _, _, quantity, price in items)
            cursor = db.execute(
                "INSERT INTO orders (customer_name, total, status, created_at) VALUES (?, ?, ?, ?)",
                (body.customer_name, total, "pending", datetime.now(timezone.utc).isoformat()),
            )
            order_id = cursor.lastrowid
            db.executemany(
                "INSERT INTO order_items (order_id, drink_id, name, quantity, unit_price) "
                "VALUES (?, ?, ?, ?, ?)",
                [(order_id, *item) for item in items],
            )
            return read_order(db, order_id)

    @app.get("/api/orders/{id}", response_model=Order)
    def get_order(id: int):
        with connect(db_path) as db:
            return read_order(db, id)

    @app.patch("/api/orders/{id}/status", response_model=Order)
    def update_status(id: int, body: StatusUpdate):
        with connect(db_path) as db:
            # Hold the write lock across the transition check and update.
            db.execute("BEGIN IMMEDIATE")
            order = read_order(db, id)
            if {"pending": "preparing", "preparing": "done"}.get(order["status"]) != body.status:
                raise HTTPException(status_code=400, detail="Invalid status transition")
            db.execute("UPDATE orders SET status = ? WHERE id = ?", (body.status, id))
            return read_order(db, id)

    return app


app = create_app()
