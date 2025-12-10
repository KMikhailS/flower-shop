import { CartItemData } from '../App';

export interface CartState {
  cartItems: CartItemData[];
  deliveryMethod: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'card' | 'sbp' | null;
  selectedAddress: string;
  timestamp: string;
}
