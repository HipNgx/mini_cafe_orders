import React, { useState, useEffect, useCallback } from 'react';
import { getMenu, formatVND } from '../api';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'tea', label: 'Tea' },
  { key: 'smoothie', label: 'Smoothie' },
];

/**
 * Menu component displays the drink catalog with category filters,
 * loading/error states, in-cart quantity indicator, and "Add to cart" action.
 */
export default function Menu({ onAddToCart, cartItems = [] }) {
  const [drinks, setDrinks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch drinks from backend
  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getMenu();
      setDrinks(data);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load menu. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Find quantity already added to cart for a given drink
  const getInCartQuantity = (drinkId) => {
    const item = cartItems.find((i) => (i.drink_id || i.id) === drinkId);
    return item ? item.quantity : 0;
  };

  // Filter drinks based on active category
  const filteredDrinks =
    selectedCategory === 'all'
      ? drinks
      : drinks.filter((drink) => drink.category === selectedCategory);

  return (
    <section className="cafe-menu-section">
      <div className="menu-header">
        <h1 className="menu-title">Handcrafted Drinks</h1>
        <p className="menu-subtitle">Freshly brewed and prepared with care</p>
      </div>

      {/* Category filter tabs */}
      <div className="category-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`category-pill ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="menu-status-container">
          <div className="loading-spinner" aria-label="Loading drinks" />
          <p className="loading-text">Brewing the menu...</p>
        </div>
      )}

      {/* Error banner with retry */}
      {!isLoading && errorMessage && (
        <div className="menu-error-banner" role="alert">
          <p className="error-text">⚠️ {errorMessage}</p>
          <button type="button" className="retry-btn" onClick={fetchMenu}>
            Retry
          </button>
        </div>
      )}

      {/* Drink cards grid */}
      {!isLoading && !errorMessage && (
        <div className="drinks-grid">
          {filteredDrinks.map((drink) => {
            const quantityInCart = getInCartQuantity(drink.id);

            return (
              <article key={drink.id} className="drink-card">
                <div className="drink-card-top">
                  <span className={`category-badge category-${drink.category}`}>
                    {drink.category}
                  </span>

                  {/* Quantity indicator if already in cart */}
                  {quantityInCart > 0 && (
                    <span className="in-cart-badge">
                      {quantityInCart} in cart
                    </span>
                  )}
                </div>

                <div className="drink-card-body">
                  <h3 className="drink-name">{drink.name}</h3>
                  <p className="drink-price">{formatVND(drink.price)}</p>
                </div>

                <div className="drink-card-actions">
                  <button
                    type="button"
                    className="add-to-cart-btn"
                    onClick={() => onAddToCart(drink)}
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
