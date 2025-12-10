import React from 'react';
import { CartItemData } from '../App';

interface Product {
  id: number;
  image: string;
  alt: string;
  title: string;
  price: string;
  description: string;
}

interface ProductCardProps {
  product: Product;
  onClose: () => void;
  onOpenCart: () => void;
  onAddToCart: (product: Product) => void;
  cartItems: CartItemData[];
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClose, onOpenCart, onAddToCart, cartItems }) => {
  // Вычисляем общее количество товаров в корзине
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Product Image Section */}
        <div className="relative h-[505px] flex-shrink-0">
          <img
            src={product.image}
            alt={product.alt}
            className="w-full h-full object-cover rounded-b-[30px]"
          />

          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-12 left-9 w-[35px] h-[35px] flex items-center justify-center"
          >
            <img src="/images/back-button.svg" alt="Back" className="w-full h-full" />
          </button>

          {/* Cart Icon with Badge */}
          <div className="absolute top-[42px] right-[25px]">
            <button
              onClick={onOpenCart}
              className="relative w-[66px] h-[66px] rounded-full bg-[#80D1C1] flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
            >
              <img src="/images/cart.svg" alt="Cart" className="w-9 h-8" />
              {cartItemCount > 0 && (
                <div className="absolute top-[7px] right-[11px] w-[15px] h-[15px] rounded-full bg-[#FF0000] flex items-center justify-center">
                  <span className="text-white text-[10px] font-normal leading-[1.21]">{cartItemCount}</span>
                </div>
              )}
            </button>
          </div>

          {/* Navigation Arrows */}
          <button className="absolute top-[245px] left-2 w-[50px] h-[50px] flex items-center justify-center">
            <img src="/images/arrow-left.svg" alt="Previous" className="w-5 h-9" />
          </button>
          <button className="absolute top-[245px] right-2 w-[50px] h-[50px] flex items-center justify-center">
            <img src="/images/arrow-right.svg" alt="Next" className="w-5 h-9" style={{ transform: 'scaleX(-1)' }} />
          </button>

          {/* Pagination Dots */}
          <div className="absolute bottom-[43px] left-1/2 transform -translate-x-1/2 flex gap-5">
            <div className="w-2 h-2 rounded-full bg-[#898989]"></div>
            <div className="w-2 h-2 rounded-full bg-[#FFF5F5]"></div>
            <div className="w-2 h-2 rounded-full bg-[#FFF5F5]"></div>
            <div className="w-2 h-2 rounded-full bg-[#FFF5F5]"></div>
            <div className="w-2 h-2 rounded-full bg-[#FFF5F5]"></div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="px-8 pt-6 pb-4">
          {/* Title and Price */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-base font-semibold leading-[1.174] text-black max-w-[184px]">
              {product.title}
            </h2>
            <p className="text-xl font-bold leading-[1.174] text-black">
              {product.price}
            </p>
          </div>

          {/* Description */}
          <p className="text-base font-normal leading-[1.174] text-black mb-8">
            {product.description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-[10px] pb-8">
            <button
              onClick={() => {
                onAddToCart(product);
                onOpenCart();
              }}
              className="flex-1 h-[66px] bg-[#80D1C1] rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-black">Купить сейчас</span>
            </button>
            <button
              onClick={() => {
                onAddToCart(product);
              }}
              className="flex-1 h-[66px] bg-[#80D1C1] rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center"
            >
              <span className="text-sm font-semibold leading-[1.174] text-black">Добавить в корзину</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
