import React from 'react';
import BottomButton from './BottomButton';
import { useCart } from '../hooks/useCart';

interface CartBottomButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

const CartBottomButton: React.FC<CartBottomButtonProps> = ({ isVisible, onClick }) => {
  const { cartItemCount } = useCart();

  if (!isVisible) return null;

  return (
    <div className="sticky bottom-0 z-10 mt-4 opacity-70">
      <BottomButton
        cartItemCount={cartItemCount}
        onClick={onClick}
      />
    </div>
  );
};

export default React.memo(CartBottomButton);
