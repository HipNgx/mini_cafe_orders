# API Contract – Cafe Order

This file is the single source of truth shared by backend and frontend.
If anything here conflicts with your assumptions, follow this file.
If something must change, update this file first, then update the code.

## General

- Backend: FastAPI + SQLite, runs at `http://localhost:8000`
- Frontend: React (Vite), runs at `http://localhost:5173`
- Backend must enable CORS for `http://localhost:5173`
- All requests and responses use JSON (`Content-Type: application/json`)
- Field names use `snake_case`
- Money is an integer in VND (e.g. `35000`), never a float
- Timestamps use ISO 8601 (e.g. `2026-10-22T09:30:00`)

## Data shapes

### Drink

```json
{
  "id": 1,
  "name": "Ca phe sua da",
  "price": 29000,
  "category": "coffee"
}
```

- `category` is one of: `coffee`, `tea`, `smoothie`

### Order

```json
{
  "id": 12,
  "customer_name": "An",
  "items": [
    { "drink_id": 1, "name": "Ca phe sua da", "quantity": 2, "unit_price": 29000 }
  ],
  "total": 58000,
  "status": "pending",
  "created_at": "2026-10-22T09:30:00"
}
```

- `status` is one of: `pending`, `preparing`, `done`
- `total` is calculated by the backend (sum of `quantity * unit_price`). The frontend never sends `total`.
- `unit_price` and `name` are copied from the drink at order time

## Endpoints

### 1. GET /api/menu

Returns all drinks.

Response `200`:

```json
[
  { "id": 1, "name": "Ca phe sua da", "price": 29000, "category": "coffee" }
]
```

### 2. POST /api/orders

Creates a new order. Initial status is always `pending`.

Request body:

```json
{
  "customer_name": "An",
  "items": [
    { "drink_id": 1, "quantity": 2 },
    { "drink_id": 4, "quantity": 1 }
  ]
}
```

Validation rules:

- `customer_name`: required, 1 to 50 characters
- `items`: required, at least 1 item
- `drink_id`: must exist in the menu
- `quantity`: integer from 1 to 20

Response `201`: the full Order object (see above).

### 3. GET /api/orders/{id}

Returns one order.

- Response `200`: the full Order object
- Response `404` if the order does not exist

### 4. PATCH /api/orders/{id}/status

Updates the order status.

Request body:

```json
{ "status": "preparing" }
```

Allowed transitions: `pending` → `preparing` → `done` (no going backwards).

- Response `200`: the updated Order object
- Response `400` if the transition is not allowed
- Response `404` if the order does not exist

## Error format

All errors return JSON in this shape:

```json
{ "detail": "Human-readable message" }
```

Validation errors may use FastAPI's default `422` format. The frontend should show a friendly message in both cases.

## Seed data

On first run the backend seeds 8 drinks across the 3 categories (coffee, tea, smoothie), with ids starting at 1.

## Out of scope (do not build)

- Login / authentication
- Payment
- Real-time updates (the frontend may refetch the order manually)
