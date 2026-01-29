import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { CartState, PersistedCartState } from '../types/cart';
import type { Product } from '../components/ProductGrid';
import { useCartPersistence } from './useCartPersistence';

const DEFAULT_ADDRESS = 'г. Тюмень ул. Пермякова, 62';

type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'increase'; productId: number }
  | { type: 'decrease'; productId: number }
  | { type: 'remove'; productId: number }
  | { type: 'decreaseOrRemove'; productId: number }
  | { type: 'clear' }
  | { type: 'setDeliveryMethod'; method: 'pickup' | 'delivery' }
  | { type: 'setSelectedAddress'; address: string }
  | { type: 'restore'; state: CartState };

interface CartContextValue {
  cartItems: CartState['cartItems'];
  deliveryMethod: CartState['deliveryMethod'];
  selectedAddress: CartState['selectedAddress'];
  cartItemCount: number;
  addItem: (product: Product) => void;
  increaseItem: (productId: number) => void;
  decreaseItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  decreaseOrRemove: (productId: number) => void;
  clearCart: () => void;
  setDeliveryMethod: (method: 'pickup' | 'delivery') => void;
  setSelectedAddress: (address: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = {
  cartItems: [],
  deliveryMethod: 'pickup',
  selectedAddress: DEFAULT_ADDRESS,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existingItem = state.cartItems.find(item => item.product.id === action.product.id);
      if (existingItem) {
        return {
          ...state,
          cartItems: state.cartItems.map(item =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cartItems: [...state.cartItems, { product: action.product, quantity: 1 }],
      };
    }
    case 'increase':
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          item.product.id === action.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    case 'decrease': {
      const item = state.cartItems.find(i => i.product.id === action.productId);
      if (!item || item.quantity <= 1) {
        return state;
      }
      return {
        ...state,
        cartItems: state.cartItems.map(i =>
          i.product.id === action.productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        ),
      };
    }
    case 'decreaseOrRemove': {
      const item = state.cartItems.find(i => i.product.id === action.productId);
      if (!item) return state;
      if (item.quantity <= 1) {
        return {
          ...state,
          cartItems: state.cartItems.filter(i => i.product.id !== action.productId),
        };
      }
      return {
        ...state,
        cartItems: state.cartItems.map(i =>
          i.product.id === action.productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        ),
      };
    }
    case 'remove':
      return {
        ...state,
        cartItems: state.cartItems.filter(item => item.product.id !== action.productId),
      };
    case 'clear':
      return {
        ...state,
        cartItems: [],
      };
    case 'setDeliveryMethod':
      return {
        ...state,
        deliveryMethod: action.method,
      };
    case 'setSelectedAddress':
      return {
        ...state,
        selectedAddress: action.address,
      };
    case 'restore':
      return {
        ...state,
        cartItems: action.state.cartItems,
        deliveryMethod: action.state.deliveryMethod,
        selectedAddress: action.state.selectedAddress,
      };
    default:
      return state;
  }
}

interface CartProviderProps {
  webApp: TelegramWebApp | null;
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ webApp, children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { saveCart, loadCart, clearCart } = useCartPersistence(webApp);

  useEffect(() => {
    if (!webApp) return;

    loadCart().then((savedCart) => {
      if (!savedCart) return;
      dispatch({
        type: 'restore',
        state: {
          cartItems: savedCart.cartItems,
          deliveryMethod: savedCart.deliveryMethod,
          selectedAddress: savedCart.selectedAddress,
        },
      });
    });
  }, [webApp, loadCart]);

  useEffect(() => {
    if (state.cartItems.length === 0) {
      clearCart();
      return;
    }

    const dataToSave: PersistedCartState = {
      ...state,
      timestamp: new Date().toISOString(),
    };
    saveCart(dataToSave);
  }, [state, saveCart, clearCart]);

  const addItem = useCallback((product: Product) => {
    dispatch({ type: 'add', product });
  }, []);

  const increaseItem = useCallback((productId: number) => {
    dispatch({ type: 'increase', productId });
  }, []);

  const decreaseItem = useCallback((productId: number) => {
    dispatch({ type: 'decrease', productId });
  }, []);

  const removeItem = useCallback((productId: number) => {
    dispatch({ type: 'remove', productId });
  }, []);

  const decreaseOrRemove = useCallback((productId: number) => {
    dispatch({ type: 'decreaseOrRemove', productId });
  }, []);

  const clearCartState = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  const setDeliveryMethod = useCallback((method: 'pickup' | 'delivery') => {
    dispatch({ type: 'setDeliveryMethod', method });
  }, []);

  const setSelectedAddress = useCallback((address: string) => {
    dispatch({ type: 'setSelectedAddress', address });
  }, []);

  const cartItemCount = useMemo(
    () => state.cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [state.cartItems]
  );

  const value = useMemo<CartContextValue>(() => ({
    cartItems: state.cartItems,
    deliveryMethod: state.deliveryMethod,
    selectedAddress: state.selectedAddress,
    cartItemCount,
    addItem,
    increaseItem,
    decreaseItem,
    removeItem,
    decreaseOrRemove,
    clearCart: clearCartState,
    setDeliveryMethod,
    setSelectedAddress,
  }), [
    state.cartItems,
    state.deliveryMethod,
    state.selectedAddress,
    cartItemCount,
    addItem,
    increaseItem,
    decreaseItem,
    removeItem,
    decreaseOrRemove,
    clearCartState,
    setDeliveryMethod,
    setSelectedAddress,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export default useCart;
