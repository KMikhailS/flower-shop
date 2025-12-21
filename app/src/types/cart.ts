import { CartItemData } from '../App';

export interface CartState {
  cartItems: CartItemData[];
  deliveryMethod: 'pickup' | 'delivery';
  selectedAddress: string;
  timestamp: string;
}
