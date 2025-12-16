import React, { useState, useEffect } from 'react';
import { PromoBannerDTO } from '../api/client';
import AdminAddPromoBanner from './AdminAddPromoBanner';

interface PromoBannerProps {
  banners: PromoBannerDTO[];
  isAdminMode?: boolean;
  onAddNew?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ banners, isAdminMode, onAddNew }) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // If no banners, handle early returns
  if (banners.length === 0) {
    // Admin mode - show add card
    if (isAdminMode && onAddNew) {
      return (
        <div className="space-y-2">
          <AdminAddPromoBanner onClick={onAddNew} />
        </div>
      );
    }
    // No admin mode - show nothing
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

  // Функции навигации по стрелкам
  const handlePrevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  // Автоматическая смена баннеров каждые 3 секунды
  useEffect(() => {
    if (banners.length <= 1) return; // Не нужен интервал для одного баннера

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000); // 3 секунды

    return () => clearInterval(interval); // Очистка при unmount
  }, [currentBannerIndex, banners.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - next banner
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe) {
      // Swipe right - previous banner
      setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }

    // Reset touch positions
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative h-[187px] overflow-hidden rounded-[20px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentBanner.image_url}
          alt="Promo Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-5">
          <div className="bg-green rounded-[30px] px-4 py-2 inline-block">
            <span className="text-white font-raleway text-xs font-medium">Акция</span>
          </div>
        </div>

        {/* Navigation Arrows - only show if multiple banners */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrevBanner}
              className="absolute top-1/2 left-2 -translate-y-1/2 w-[50px] h-[50px] flex items-center justify-center"
            >
              <img src="/images/arrow-left.svg" alt="Previous" className="w-5 h-9" />
            </button>
            <button
              onClick={handleNextBanner}
              className="absolute top-1/2 right-2 -translate-y-1/2 w-[50px] h-[50px] flex items-center justify-center"
            >
              <img src="/images/arrow-right.svg" alt="Next" className="w-5 h-9" />
            </button>
          </>
        )}
      </div>

      {/* Pagination dots - only show if multiple banners */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2">
          {banners.map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all ${
                index === currentBannerIndex
                  ? 'w-2.5 h-2.5 bg-[#898989]'
                  : 'w-2 h-2 bg-[#FFF5F5]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Admin add new banner card */}
      {isAdminMode && onAddNew && (
        <AdminAddPromoBanner onClick={onAddNew} />
      )}
    </div>
  );
};

export default PromoBanner;
