from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from database import SEED_DRINKS, connect
from main import create_app


@pytest.fixture
def db_path(tmp_path):
    return tmp_path / "test.db"


@pytest.fixture
def client(db_path):
    with TestClient(create_app(db_path)) as client:
        yield client


def payload():
    return {"customer_name": "An", "items": [
        {"drink_id": 1, "quantity": 2}, {"drink_id": 4, "quantity": 1}
    ]}


def test_seed_and_restart(db_path):
    with TestClient(create_app(db_path)) as client:
        response = client.get("/api/menu")
        assert response.status_code == 200
        assert response.json() == [
            dict(zip(("id", "name", "price", "category"), row)) for row in SEED_DRINKS
        ]
        order = client.post("/api/orders", json=payload()).json()
    with connect(db_path) as db:
        db.execute("UPDATE drinks SET price = 30000 WHERE id = 1")
    with TestClient(create_app(db_path)) as client:
        menu = client.get("/api/menu").json()
        assert len(menu) == 8
        assert menu[0]["price"] == 30000
        assert client.get(f"/api/orders/{order['id']}").json() == order


def test_create_and_price_snapshot(client, db_path):
    response = client.post("/api/orders", json=payload())
    assert response.status_code == 201
    assert response.headers["content-type"] == "application/json"
    order = response.json()
    assert set(order) == {"id", "customer_name", "items", "total", "status", "created_at"}
    assert order["customer_name"] == "An"
    assert order["status"] == "pending"
    assert order["total"] == 93000
    assert type(order["total"]) is int
    assert datetime.fromisoformat(order["created_at"]).tzinfo is not None
    assert order["items"] == [
        {"drink_id": 1, "name": "Ca phe sua da", "quantity": 2, "unit_price": 29000},
        {"drink_id": 4, "name": "Tra dao cam sa", "quantity": 1, "unit_price": 35000},
    ]
    with connect(db_path) as db:
        db.execute("UPDATE drinks SET name = 'New name', price = 1 WHERE id = 1")
    fetched = client.get(f"/api/orders/{order['id']}")
    assert fetched.status_code == 200
    assert fetched.json() == order


@pytest.mark.parametrize("name", ["", "a" * 51, None, 123])
def test_invalid_names(client, name):
    body = payload()
    body["customer_name"] = name
    assert client.post("/api/orders", json=body).status_code == 422


@pytest.mark.parametrize("quantity", [0, 21, -1, 1.5, 2.0, True, "2", None])
def test_invalid_quantities(client, quantity):
    body = payload()
    body["items"][0]["quantity"] = quantity
    assert client.post("/api/orders", json=body).status_code == 422


@pytest.mark.parametrize("body", [
    {}, {"customer_name": "An"}, {"items": [{"drink_id": 1, "quantity": 1}]},
    {"customer_name": "An", "items": []},
    {"customer_name": "An", "items": [{"drink_id": 1}]},
    {"customer_name": "An", "items": [{"quantity": 1}]},
    {**payload(), "total": 1}, {**payload(), "status": "done"},
])
def test_invalid_request_shapes(client, body):
    assert client.post("/api/orders", json=body).status_code == 422


@pytest.mark.parametrize("drink_id", [True, "1", 1.5])
def test_invalid_drink_id_type(client, drink_id):
    body = payload()
    body["items"][0]["drink_id"] = drink_id
    assert client.post("/api/orders", json=body).status_code == 422


@pytest.mark.parametrize("name,quantity", [("A", 1), ("a" * 50, 20)])
def test_valid_boundaries(client, name, quantity):
    response = client.post("/api/orders", json={
        "customer_name": name, "items": [{"drink_id": 1, "quantity": quantity}]
    })
    assert response.status_code == 201
    assert response.json()["total"] == 29000 * quantity


def test_unknown_drink_rolls_back(client, db_path):
    body = payload()
    body["items"].append({"drink_id": 999, "quantity": 1})
    response = client.post("/api/orders", json=body)
    assert response.status_code == 400
    assert response.json() == {"detail": "Drink not found"}
    with connect(db_path) as db:
        assert db.execute("SELECT count(*) FROM orders").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM order_items").fetchone()[0] == 0


def test_missing_order(client):
    for response in [client.get("/api/orders/999"),
                     client.patch("/api/orders/999/status", json={"status": "preparing"})]:
        assert response.status_code == 404
        assert response.json() == {"detail": "Order not found"}


@pytest.mark.parametrize("current,target,allowed", [
    (current, target, (current, target) in [("pending", "preparing"), ("preparing", "done")])
    for current in ["pending", "preparing", "done"]
    for target in ["pending", "preparing", "done"]
])
def test_all_status_transitions(client, current, target, allowed):
    order = client.post("/api/orders", json=payload()).json()
    url = f"/api/orders/{order['id']}/status"
    if current in ("preparing", "done"):
        assert client.patch(url, json={"status": "preparing"}).status_code == 200
    if current == "done":
        assert client.patch(url, json={"status": "done"}).status_code == 200
    response = client.patch(url, json={"status": target})
    assert response.status_code == (200 if allowed else 400)
    if allowed:
        assert response.json() == {**order, "status": target}
    else:
        assert response.json() == {"detail": "Invalid status transition"}
    assert client.get(f"/api/orders/{order['id']}").json()["status"] == (target if allowed else current)


@pytest.mark.parametrize("body", [{}, {"status": "cancelled"}, {"status": None}])
def test_invalid_status(client, body):
    order = client.post("/api/orders", json=payload()).json()
    assert client.patch(f"/api/orders/{order['id']}/status", json=body).status_code == 422


def test_cors(client):
    response = client.options("/api/orders", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"]
    response = client.get("/api/menu", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    response = client.get("/api/menu", headers={"Origin": "http://example.com"})
    assert "access-control-allow-origin" not in response.headers
