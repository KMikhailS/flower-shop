import type { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  cartItems: CartItem[];
  deliveryMethod: 'pickup' | 'delivery';
  selectedAddress: string;
}

export interface PersistedCartState extends CartState {
  timestamp: string;
}
