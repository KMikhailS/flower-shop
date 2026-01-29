import type { Product } from '../components/ProductGrid';

export interface CartItemData {
  product: Product;
  quantity: number;
}

export interface CartState {
  cartItems: CartItemData[];
  deliveryMethod: 'pickup' | 'delivery';
  selectedAddress: string;
}

export interface PersistedCartState extends CartState {
  timestamp: string;
}
