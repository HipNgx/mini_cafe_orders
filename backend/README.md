# Cafe Order backend

Use Python 3.10+ with pip and venv. In PowerShell:

```powershell
cd C:\cafe_order\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

If your PowerShell policy blocks activation, run the executable:

```powershell
.\.venv\Scripts\uvicorn.exe main:app --reload --port 8000
```

Open http://localhost:8000/docs for the API documentation. The frontend can
call the API from http://localhost:5173 through CORS.

Run tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

This machine uses MSYS2 Python, which creates `.venv\bin` instead of
`.venv\Scripts`. With that interpreter, use:

```powershell
cd C:\cafe_order\backend
python -m venv .venv
.\.venv\bin\python.exe -m pip install -r requirements.txt
.\.venv\bin\python.exe -m uvicorn main:app --reload --port 8000
# In a separate terminal:
.\.venv\bin\python.exe -m pytest -q
```

Dependency installation requires access to the Python package index. During
implementation, the sandbox denied that connection with `WinError 10013`.
Install dependencies in an environment with permitted package access before
running the API tests or server.

The app creates `cafe.db` beside `database.py` on startup. On database creation,
the app seeds the eight agreed drinks with IDs 1 through 8. On later starts,
the app preserves menu edits and orders. Tests use separate temporary databases.

API endpoints:

- `GET /api/menu`: all drinks, ordered by ID.
- `POST /api/orders`: create an order with status `pending`; return 201.
- `GET /api/orders/{id}`: fetch an order; return 404 for a missing order.
- `PATCH /api/orders/{id}/status`: advance `pending` to `preparing`, then `done`.

The backend calculates integer VND totals and stores each item's name and price
at purchase time. Timestamps include the UTC offset in ISO 8601 format.
Requests must supply integer quantities from 1 to 20; the backend rejects
booleans, fractions, and numeric strings. Customer names accept 1 to 50
characters. Duplicate drink entries remain separate line items.
The backend rejects unknown request fields with 422, unknown drink IDs with
400, and skipped, repeated, or backward status transitions with 400.
