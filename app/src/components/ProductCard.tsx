import React, { useEffect, useState } from 'react';
import { CartItemData } from '../App';
import { UserInfo } from '../api/client';

interface Product {
  id: number;
  image: string;
  images?: string[];
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
  userInfo?: UserInfo;
  onEdit?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenCart, onAddToCart, cartItems, userInfo, onEdit }) => {
  // Вычисляем общее количество товаров в корзине
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Состояние для навигации по изображениям
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Получаем массив изображений (или используем основное изображение)
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  // Отключаем прокрутку body при открытии модального окна
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  return (
    <div className="fixed inset-0 bg-white z-50 max-w-[402px] mx-auto overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Product Image Section */}
        <div className="relative h-[505px] flex-shrink-0">
          <img
            src={images[currentImageIndex]}
            alt={product.alt}
            className="w-full h-full object-cover rounded-b-[30px]"
          />

          {/* Back Button */}
          {/*<button*/}
          {/*  onClick={onClose}*/}
          {/*  className="absolute top-12 left-9 w-[35px] h-[35px] flex items-center justify-center"*/}
          {/*>*/}
          {/*  <img src="/images/back-button.svg" alt="Back" className="w-full h-full" />*/}
          {/*</button>*/}

          {/* Edit Button (only for ADMIN) */}
          {userInfo?.mode === 'ADMIN' && onEdit && (
            <div className="absolute top-[42px] right-[105px]">
              <button
                onClick={onEdit}
                className="w-[66px] h-[66px] rounded-full bg-[#80D1C1] flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Cart Icon with Badge */}
          <div className="absolute top-[42px] right-[25px]">
            <button
              onClick={onOpenCart}
              className="relative w-[66px] h-[66px] rounded-full bg-[#80D1C1] flex items-center justify-center shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="#000000" d="M14 13.1V12H4.6l.6-1.1l9.2-.9L16 4H3.7L3 1H0v1h2.2l2.1 8.4L3 13v1.5c0 .8.7 1.5 1.5 1.5S6 15.3 6 14.5S5.3 13 4.5 13H12v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5c0-.7-.4-1.2-1-1.4z"/></svg>
              {cartItemCount > 0 && (
                <div className="absolute top-[7px] right-[11px] w-[15px] h-[15px] rounded-full bg-[#FF0000] flex items-center justify-center">
                  <span className="text-white text-[10px] font-normal leading-[1.21]">{cartItemCount}</span>
                </div>
              )}
            </button>
          </div>

          {/* Navigation Arrows - only show if there are multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute top-[245px] left-2 w-[50px] h-[50px] flex items-center justify-center"
              >
                <img src="/images/arrow-left.svg" alt="Previous" className="w-5 h-9" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute top-[245px] right-2 w-[50px] h-[50px] flex items-center justify-center"
              >
                <img src="/images/arrow-right.svg" alt="Next" className="w-5 h-9" />
              </button>
            </>
          )}

          {/* Pagination Dots */}
          <div className="absolute bottom-[43px] left-1/2 transform -translate-x-1/2 flex gap-5">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-[#898989]' : 'bg-[#FFF5F5]'
                }`}
              />
            ))}
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
