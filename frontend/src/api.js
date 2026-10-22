import { API_BASE_URL } from './config';

/**
 * Format raw error responses from the backend into human-readable messages.
 */
async function parseError(response) {
  try {
    const data = await response.json();
    if (data && data.detail) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return data.detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
      }
      return JSON.stringify(data.detail);
    }
  } catch {
    // Non-JSON response or parse error
  }

  if (response.status === 404) {
    return 'The requested resource could not be found (404).';
  }
  if (response.status === 422) {
    return 'Validation failed. Please verify your submitted data (422).';
  }
  return `Server responded with status code ${response.status}.`;
}

/**
 * GET /api/menu
 */
export async function getMenu() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/menu`);
    if (!res.ok) {
      const msg = await parseError(res);
      throw new Error(msg);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Cannot connect to cafe server. Please check if backend is running at http://localhost:8000.');
    }
    throw err;
  }
}

/**
 * POST /api/orders
 * Payload: { customer_name: string, items: [{ drink_id: int, quantity: int }] }
 */
export async function createOrder(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const msg = await parseError(res);
      throw new Error(msg);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Cannot connect to cafe server. Please check if backend is running at http://localhost:8000.');
    }
    throw err;
  }
}

/**
 * GET /api/orders/{id}
 */
export async function getOrder(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`);
    if (!res.ok) {
      const msg = await parseError(res);
      throw new Error(msg);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Cannot connect to cafe server. Please check if backend is running at http://localhost:8000.');
    }
    throw err;
  }
}

/**
 * PATCH /api/orders/{id}/status
 * Payload: { status: "preparing" | "done" }
 */
export async function updateOrderStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const msg = await parseError(res);
      throw new Error(msg);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError') {
      throw new Error('Cannot connect to cafe server. Please check if backend is running at http://localhost:8000.');
    }
    throw err;
  }
}

/**
 * Formats an integer amount as Vietnamese Dong (e.g. 29.000 ₫)
 */
export function formatVND(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}
