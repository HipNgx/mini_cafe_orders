# Cafe Drink Ordering App – Frontend

A modern, warm cafe-styled React web application for ordering cafe drinks (coffee, tea, smoothie). Built with React and Vite according to `API_CONTRACT.md`.

## Prerequisites

- Node.js (v18+ recommended)
- Cafe Order backend running at `http://localhost:8000`

## Installation and Run Commands

1. In PowerShell or your terminal, navigate to the `frontend/` directory:

   ```bash
   cd c:\cafe_order\frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Vite development server:

   ```bash
   npm run dev
   ```

The application will be running at [http://localhost:5173](http://localhost:5173).

## Features & Contract Compliance

- **Menu Screen**: Fetches drinks from `GET /api/menu`, categorized by coffee, tea, and smoothie with formatted VND pricing (e.g. `29.000 ₫`) and an in-cart counter badge.
- **Cart Screen**: Adjust quantities between 1 and 20, remove items, clear cart, preview estimated subtotal, and place orders with customer name validation (required, 1–50 characters).
  - *Contract compliance*: Never sends `total` or `unit_price`; only sends `{ customer_name, items: [{ drink_id, quantity }] }`.
- **Order Status Screen**: Displays order details from `GET /api/orders/{id}`, progression steps (`pending` → `preparing` → `done`), creation timestamp, line items, server-calculated total, live status refresh button, order lookup by ID, and action button to advance status for testing.
- **Error Handling**: Displays friendly error messages for 400, 404, 422, and backend connection issues.
