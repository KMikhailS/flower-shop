import React from 'react';

interface Product {
  id: number;
  image: string;
  title: string;
  price: string;
}

interface CartItemProps {
  product: Product;
  quantity: number;
  totalPrice: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({
  product,
  quantity,
  totalPrice,
  onDecrease,
  onIncrease,
  onRemove,
}) => {
  return (
    <div className="relative bg-white rounded-[15px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] p-6 pb-8 mb-6">
      <div className="flex gap-4 mb-3">
        {/* Product Image */}
        <div
          className="w-[86px] h-[82px] rounded-[10px] bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(${product.image})` }}
        />

        {/* Product Info */}
        <div className="flex-1">
          <h3 className="text-base font-bold leading-[1.174] text-black mb-2">
            {product.title}
          </h3>
          <p className="text-base font-semibold leading-[1.174] text-black">
            {totalPrice} руб.
          </p>
        </div>
      </div>

      {/* Quantity Counter and Delete Button */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3">
        {/* Quantity Counter */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDecrease}
            className="w-4 h-4 bg-[#D9D9D9] rounded-[2px] flex items-center justify-center"
          >
            <div className="w-[6px] h-[1px] bg-black" />
          </button>
          <span className="text-base font-medium leading-[1.174] text-black w-2 text-center">
            {quantity}
          </span>
          <button
            onClick={onIncrease}
            className="w-4 h-4 bg-[#80D1C1] rounded-[2px] flex items-center justify-center text-base font-medium leading-[1.174] text-black"
          >
            +
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label="Удалить товар"
        >
          <img src="/images/icons/trash-icon.svg" alt="Удалить" className="w-full h-full" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
