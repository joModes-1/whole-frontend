import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getProductImage, getPlaceholderImage } from '../../utils/imageUtils';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const formatUGX = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(Number(amount) || 0);
    } catch {
      return `UGX ${Math.round(Number(amount) || 0).toLocaleString('en-UG')}`;
    }
  }, []);
  const { cart, total, removeFromCart, updateQuantity } = useCart();


  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart to continue shopping.</p>
        <button 
          className="continue-shopping"
          onClick={() => navigate('/products')}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={`${item._id}-${item.quantity}`} className="cart-item">
            <div className="item-image">
              <img 
                src={getProductImage(item)} 
                alt={item.name} 
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = getPlaceholderImage();
                }}
              />
            </div>
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="item-price">{formatUGX(item.price)}</p>
              <div className="quantity-controls">
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="item-total">
              <p>{formatUGX(item.price * item.quantity)}</p>
              <button
                className="remove-item"
                onClick={() => removeFromCart(item._id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>{formatUGX(total)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping:</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>{formatUGX(total)}</span>
        </div>
        <button
          className="checkout-button"
          onClick={handleCheckout}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart; 