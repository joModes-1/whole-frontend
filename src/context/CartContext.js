import React, { createContext, useContext } from 'react';
import { createSlice, configureStore } from '@reduxjs/toolkit';

const CartContext = createContext();

// Load cart from localStorage if available
const getInitialCartState = () => {
  try {
    const stored = localStorage.getItem('cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        items: parsed.items || [],
        total: parsed.total || 0,
        loading: false,
        error: null
      };
    }
  } catch (e) {
    console.error('Error reading cart from localStorage:', e);
  }
  return {
    items: [],
    total: 0,
    loading: false,
    error: null
  };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: getInitialCartState(),
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item._id === action.payload._id);
      if (existingItem) {
        state.items = state.items.map(item =>
          item._id === action.payload._id
            ? { ...action.payload, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        state.items.push(action.payload);
      }
      state.total = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      
      // Save to localStorage
      try {
        localStorage.setItem('cart', JSON.stringify({
          items: state.items,
          total: state.total
        }));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    },
    removeFromCart: (state, action) => {
      const itemToRemove = state.items.find(item => item._id === action.payload);
      state.items = state.items.filter(item => item._id !== action.payload);
      state.total -= itemToRemove.price * itemToRemove.quantity;
      
      // Save to localStorage
      try {
        localStorage.setItem('cart', JSON.stringify({
          items: state.items,
          total: state.total
        }));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    },
    updateQuantity: (state, action) => {
      state.items = state.items.map(item => {
        if (item._id === action.payload.id) {
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      });
      state.total = state.items.reduce((total, item) => {
        if (item._id === action.payload.id) {
          return total + (item.price * action.payload.quantity);
        }
        return total + (item.price * item.quantity);
      }, 0);
      
      // Save to localStorage
      try {
        localStorage.setItem('cart', JSON.stringify({
          items: state.items,
          total: state.total
        }));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      
      // Save to localStorage
      try {
        localStorage.setItem('cart', JSON.stringify({
          items: [],
          total: 0
        }));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

const store = configureStore({
  reducer: {
    cart: cartSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['cart/addToCart', 'cart/removeFromCart', 'cart/updateQuantity'],
        ignoredPaths: ['cart.items']
      }
    })
});

export const CartProvider = ({ children }) => {
  const dispatch = store.dispatch;
  const [cartState, setCartState] = React.useState(store.getState().cart);

  React.useEffect(() => {
    // Subscribe to Redux store changes and update state
    const unsubscribe = store.subscribe(() => {
      setCartState(store.getState().cart);
    });
    return unsubscribe;
  }, []);

  const addToCart = (product) => {
    dispatch(cartSlice.actions.addToCart(product));
  };

  const removeFromCart = (productId) => {
    dispatch(cartSlice.actions.removeFromCart(productId));
  };

  const updateQuantity = (productId, quantity) => {
    dispatch(cartSlice.actions.updateQuantity({ id: productId, quantity }));
  };

  const clearCart = () => {
    dispatch(cartSlice.actions.clearCart());
  };

  const value = {
    cart: cartState.items,
    total: cartState.total,
    loading: cartState.loading,
    error: cartState.error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 