import React, { useRef, useState } from 'react';
import type { Product } from '../types/product';
import { formatRuble } from '../utils/formatCurrency';

interface ProductGridCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  isPriority?: boolean;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, onClick, isPriority = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  // Получаем массив изображений (или используем основное изображение)
  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  // Минимальное расстояние для срабатывания свайпа (в пикселях)
  const minSwipeDistance = 30;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    const touchStart = touchStartRef.current;
    const touchEnd = touchEndRef.current;
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }
  };

  const handleCardClick = () => {
    // Предотвращаем открытие карточки при свайпе
    if (touchStartRef.current !== null && touchEndRef.current !== null) {
      const distance = Math.abs(touchStartRef.current - touchEndRef.current);
      if (distance > 10) {
        // Был свайп, не открываем карточку
        return;
      }
    }
    onClick?.(product);
  };

  return (
    <div
      className="cursor-pointer"
      onClick={handleCardClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Image Container */}
      <div className="relative rounded-[20px] overflow-hidden h-[200px]">
        <img
          src={images[currentImageIndex]}
          alt={product.alt}
          className="w-full h-full object-cover bg-gray-100"
          loading={isPriority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={isPriority ? 'high' : 'auto'}
          sizes="(max-width: 480px) 50vw, 200px"
        />

        {/* Status Badge */}
        {product.status === 'BLOCKED' && (
          <div className="absolute top-2 left-2 bg-gray-medium bg-opacity-90 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Не активен
          </div>
        )}

        {/* Pagination Dots - only show if there are multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Price and Title Section */}
      <div className="mt-2 px-1">
        <div className="flex items-baseline gap-2">
          <span className="text-black font-bold text-base">{formatRuble(product.price)}</span>
          {product.non_discount_price && (
            <span className="text-gray-400 text-xs line-through">{formatRuble(product.non_discount_price)}</span>
          )}
        </div>
        <p className="text-black text-sm mt-1 line-clamp-2">{product.title}</p>
      </div>
    </div>
  );
};

export default React.memo(ProductGridCard);
