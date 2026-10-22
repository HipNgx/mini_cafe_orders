import React, { useState } from 'react';
import { createOrder, formatVND } from '../api';

/**
 * Cart Component
 *
 * Displays the current cart items, calculates client-side estimated total,
 * validates customer details, and submits orders according to the API contract.
 *
 * @param {Object} props
 * @param {Array<{ id: number, name: string, price: number, quantity: number }>} props.cartItems
 * @param {(drinkId: number, newQuantity: number) => void} props.onUpdateQuantity
 * @param {(drinkId: number) => void} props.onRemoveItem
 * @param {() => void} props.onClearCart
 * @param {(order: Object) => void} props.onOrderPlaced
 * @param {() => void} props.onBrowseMenu
 */
export default function Cart({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  onBrowseMenu,
}) {
  const [customerName, setCustomerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate estimated total client-side
  const estimatedTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // If cart is empty, render friendly empty state
  if (cartItems.length === 0) {
    return (
      <div className="cart-container empty-cart-container">
        <div className="empty-cart-card">
          <h2>Your Cart is Empty</h2>
          <p>You haven't selected any drinks yet. Check out our menu!</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onBrowseMenu}
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  // Handle customer name change and inline validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.trim().length > 50) {
      setNameError('Name must be 50 characters or less.');
    } else if (nameError) {
      setNameError('');
    }
  };

  // Submit order to backend
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const trimmedName = customerName.trim();

    // Customer name validation: required, 1 to 50 characters
    if (!trimmedName) {
      setNameError('Please enter your name.');
      return;
    }
    if (trimmedName.length > 50) {
      setNameError('Name must be between 1 and 50 characters.');
      return;
    }

    setNameError('');
    setIsSubmitting(true);

    try {
      /**
       * CRITICAL CONTRACT REQUIREMENT:
       * Only send `customer_name` and `items` ({ drink_id, quantity }).
       * Never send `total` or `unit_price`.
       */
      const payload = {
        customer_name: trimmedName,
        items: cartItems.map((item) => ({
          drink_id: item.id,
          quantity: item.quantity,
        })),
      };

      const newOrder = await createOrder(payload);

      // Reset cart and notify parent
      if (onClearCart) {
        onClearCart();
      }
      if (onOrderPlaced) {
        onOrderPlaced(newOrder);
      }
    } catch (err) {
      // Friendly error handling for 400, 422, or network errors
      let errorMessage = 'Failed to place order. Please try again.';

      if (err.response && err.response.data) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // FastAPI 422 validation errors
          errorMessage = detail.map((d) => d.msg || `${d.loc?.join('.')}: invalid`).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Your Order</h2>
        <button
          type="button"
          className="btn btn-secondary clear-cart-btn"
          onClick={onClearCart}
          disabled={isSubmitting}
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-content-layout">
        {/* Cart Items List */}
        <div className="cart-items-panel">
          {cartItems.map((item) => {
            const itemSubtotal = item.price * item.quantity;

            return (
              <div key={item.id} className="cart-item-row">
                <div className="item-details">
                  <h4 className="item-name">{item.name}</h4>
                  <span className="item-unit-price">
                    {formatVND(item.price)} each
                  </span>
                </div>

                {/* Quantity Controls (1 to 20 as defined by API validation) */}
                <div className="quantity-control">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || isSubmitting}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    -
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= 20 || isSubmitting}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>

                <div className="item-subtotal">
                  <span>{formatVND(itemSubtotal)}</span>
                </div>

                <button
                  type="button"
                  className="remove-item-btn"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isSubmitting}
                  aria-label={`Remove ${item.name} from cart`}
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>

        {/* Checkout Panel */}
        <div className="checkout-panel">
          <h3>Order Details</h3>

          <form onSubmit={handlePlaceOrder} noValidate>
            <div className="form-group">
              <label htmlFor="customer-name">
                Customer Name <span className="required-star">*</span>
              </label>
              <input
                id="customer-name"
                type="text"
                className={`form-input ${nameError ? 'input-error' : ''}`}
                value={customerName}
                onChange={handleNameChange}
                placeholder="Enter your name"
                maxLength={50}
                disabled={isSubmitting}
                required
              />
              {nameError && <p className="error-text">{nameError}</p>}
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span>Total Items:</span>
                <span>
                  {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
              </div>
              <div className="summary-row total-row">
                <strong>Estimated Total:</strong>
                <strong>{formatVND(estimatedTotal)}</strong>
              </div>
            </div>

            {submitError && (
              <div className="error-alert order-error-message">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block checkout-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>

            <button
              type="button"
              className="btn btn-link btn-block browse-more-btn"
              onClick={onBrowseMenu}
              disabled={isSubmitting}
            >
              Add more drinks
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
