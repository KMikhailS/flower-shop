import { useCallback } from 'react';
import { CartState } from '../types/cart';
import { products } from '../components/ProductGrid';

const CART_STORAGE_KEY = 'fanfantulpan_cart';
const CART_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 часа

interface UseCartPersistenceReturn {
  saveCart: (cartState: CartState) => void;
  loadCart: () => Promise<CartState | null>;
  clearCart: () => void;
}

export const useCartPersistence = (webApp: TelegramWebApp | null): UseCartPersistenceReturn => {

  // Сохранение в CloudStorage или localStorage
  const saveCart = useCallback((cartState: CartState) => {
    const dataToSave = JSON.stringify(cartState);

    // Пытаемся использовать CloudStorage
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.setItem(CART_STORAGE_KEY, dataToSave, (error) => {
        if (error) {
          console.error('CloudStorage save error:', error);
          // Fallback на localStorage
          try {
            localStorage.setItem(CART_STORAGE_KEY, dataToSave);
          } catch (e) {
            console.error('localStorage save error:', e);
          }
        }
      });
    } else {
      // Fallback на localStorage
      try {
        localStorage.setItem(CART_STORAGE_KEY, dataToSave);
      } catch (e) {
        console.error('localStorage save error:', e);
      }
    }
  }, [webApp]);

  // Загрузка из CloudStorage или localStorage
  const loadCart = useCallback((): Promise<CartState | null> => {
    return new Promise((resolve) => {
      // Пытаемся загрузить из CloudStorage
      if (webApp?.CloudStorage) {
        webApp.CloudStorage.getItem(CART_STORAGE_KEY, (error, value) => {
          if (error || !value) {
            // Fallback на localStorage
            try {
              const localData = localStorage.getItem(CART_STORAGE_KEY);
              resolve(validateAndParseCart(localData));
            } catch (e) {
              console.error('localStorage load error:', e);
              resolve(null);
            }
          } else {
            resolve(validateAndParseCart(value));
          }
        });
      } else {
        // Fallback на localStorage
        try {
          const localData = localStorage.getItem(CART_STORAGE_KEY);
          resolve(validateAndParseCart(localData));
        } catch (e) {
          console.error('localStorage load error:', e);
          resolve(null);
        }
      }
    });
  }, [webApp]);

  // Очистка корзины
  const clearCart = useCallback(() => {
    // Удаляем из CloudStorage
    if (webApp?.CloudStorage) {
      webApp.CloudStorage.removeItem(CART_STORAGE_KEY, (error) => {
        if (error) {
          console.error('CloudStorage clear error:', error);
        }
      });
    }

    // Удаляем из localStorage
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error('localStorage clear error:', e);
    }
  }, [webApp]);

  return { saveCart, loadCart, clearCart };
};

// Валидация и парсинг данных корзины
function validateAndParseCart(data: string | null): CartState | null {
  if (!data) return null;

  try {
    const cartState: CartState = JSON.parse(data);

    // Проверяем структуру данных
    if (!cartState || typeof cartState !== 'object') {
      return null;
    }

    // Проверяем актуальность данных (не старше 24 часов)
    const timestamp = new Date(cartState.timestamp).getTime();
    const now = Date.now();
    if (now - timestamp > CART_MAX_AGE_MS) {
      console.log('Cart data is too old, discarding');
      return null;
    }

    // Проверяем существование всех продуктов в корзине
    if (cartState.cartItems && Array.isArray(cartState.cartItems)) {
      const allProductsExist = cartState.cartItems.every(item =>
        products.some(p => p.id === item.product.id)
      );
      if (!allProductsExist) {
        console.log('Some products no longer exist, discarding cart');
        return null;
      }
    }

    return cartState;
  } catch (e) {
    console.error('Failed to parse cart data:', e);
    return null;
  }
}
