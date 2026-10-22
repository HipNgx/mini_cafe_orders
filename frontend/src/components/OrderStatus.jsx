import React, { useState, useEffect } from 'react';
import { getOrder, updateOrderStatus, formatVND } from '../api';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'done', label: 'Done' }
];

/**
 * Maps the current status to the next logical status in the workflow.
 */
const NEXT_STATUS = {
  pending: 'preparing',
  preparing: 'done'
};

const NEXT_STATUS_LABEL = {
  pending: 'Mark as Preparing',
  preparing: 'Mark as Done'
};

export default function OrderStatus({ initialOrder = null, onBrowseMenu }) {
  const [order, setOrder] = useState(initialOrder);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize when the initialOrder prop updates (e.g., newly placed order)
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
      setError(null);
    }
  }, [initialOrder]);

  /**
   * Refetches an order by its ID from the API.
   */
  const fetchOrderById = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err.message || `Order #${id} could not be found.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user searching for an order by ID.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedId = searchId.trim();

    if (!trimmedId || isNaN(trimmedId)) {
      setError('Please enter a valid numeric Order ID.');
      return;
    }

    fetchOrderById(trimmedId);
  };

  /**
   * Refreshes the currently displayed order.
   */
  const handleRefresh = () => {
    if (order?.id) {
      fetchOrderById(order.id);
    }
  };

  /**
   * Advances the status to the next step (pending -> preparing -> done).
   */
  const handleAdvanceStatus = async () => {
    if (!order) return;
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setActionLoading(true);
    setError(null);

    try {
      const updatedOrder = await updateOrderStatus(order.id, nextStatus);
      setOrder(updatedOrder);
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Formats ISO 8601 timestamp for display.
   */
  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine current step index for the progress stepper
  const currentStepIndex = order
    ? STATUS_STEPS.findIndex((step) => step.key === order.status)
    : -1;

  const nextStatus = order ? NEXT_STATUS[order.status] : null;

  return (
    <div className="order-status-container">
      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className="order-search-bar">
        <input
          type="number"
          placeholder="Lookup by Order ID (e.g. 1)"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          min="1"
          aria-label="Order ID"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error Message Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Main Order Details Card */}
      {order ? (
        <div className="order-card">
          <div className="order-card-header">
            <div>
              <h2>Order #{order.id}</h2>
              <p className="order-meta">
                Customer: <strong>{order.customer_name}</strong> &bull;{' '}
                {formatTimestamp(order.created_at)}
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary refresh-btn"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh order status"
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {/* Status Stepper */}
          <div className="status-stepper" aria-label="Order Progress">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = currentStepIndex > index;
              const isActive = currentStepIndex === index;

              return (
                <div
                  key={step.key}
                  className={`status-step ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                >
                  <div className="step-badge">
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="step-label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Items Summary Table */}
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatVND(item.unit_price)}</td>
                  <td>{formatVND(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right">
                  <strong>Total:</strong>
                </td>
                <td>
                  <strong>{formatVND(order.total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Actions & Advancements */}
          <div className="order-card-actions">
            {nextStatus && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleAdvanceStatus}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : NEXT_STATUS_LABEL[order.status]}
              </button>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={onBrowseMenu}
            >
              Order more drinks
            </button>
          </div>
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="order-empty-state">
            <p>No order selected. Enter an Order ID above to track your drink.</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={onBrowseMenu}
            >
              Back to Menu
            </button>
          </div>
        )
      )}
    </div>
  );
}
