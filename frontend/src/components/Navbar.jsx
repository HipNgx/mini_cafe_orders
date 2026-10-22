import React from 'react';

/**
 * Navigation header with cafe branding and tab navigation.
 * Includes a live badge counter for items currently in the cart.
 */
export default function Navbar({ activeTab, setActiveTab, cartItemCount = 0 }) {
  const navTabs = [
    { id: 'menu', label: 'Menu' },
    { id: 'cart', label: 'Cart', badge: cartItemCount },
    { id: 'status', label: 'Order Status' },
  ];

  return (
    <header className="cafe-navbar">
      <div className="navbar-container">
        {/* Brand Logo & Name */}
        <div className="navbar-brand" onClick={() => setActiveTab('menu')}>
          <span className="coffee-cup-icon" role="img" aria-label="coffee cup">
            ☕
          </span>
          <span className="brand-name">Aroma Cafe</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-tabs" aria-label="Main Navigation">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{tab.label}</span>
                {/* Cart badge counter */}
                {tab.id === 'cart' && tab.badge > 0 && (
                  <span className="cart-badge-counter">{tab.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
