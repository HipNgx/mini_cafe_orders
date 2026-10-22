import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState('menu');
  const [cartItems, setCartItems] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleAddToCart = (drink) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === drink.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === drink.id
            ? { ...item, quantity: Math.min(20, item.quantity + 1) }
            : item
        );
      }
      return [...prevItems, { ...drink, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (drinkId, quantity) => {
    const clampedQuantity = Math.max(1, Math.min(20, quantity));
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === drinkId ? { ...item, quantity: clampedQuantity } : item
      )
    );
  };

  const handleRemoveItem = (drinkId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== drinkId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOrderPlaced = (order) => {
    setCurrentOrder(order);
    setCartItems([]);
    setActiveTab('status');
  };

  const handleBrowseMenu = () => {
    setActiveTab('menu');
  };

  return (
    <div className="app-wrapper">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemCount={cartItemCount}
      />

      <main className="main-content">
        {activeTab === 'menu' && (
          <Menu onAddToCart={handleAddToCart} cartItems={cartItems} />
        )}
        {activeTab === 'cart' && (
          <Cart
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOrderPlaced={handleOrderPlaced}
            onBrowseMenu={handleBrowseMenu}
          />
        )}
        {activeTab === 'status' && (
          <OrderStatus
            initialOrder={currentOrder}
            onBrowseMenu={handleBrowseMenu}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Cafe Order. All rights reserved.</p>
      </footer>
    </div>
  );
}
