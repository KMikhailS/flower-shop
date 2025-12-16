import React, { useState } from 'react';
import { PromoBannerDTO } from '../api/client';

interface PromoBannerProps {
  banners: PromoBannerDTO[];
}

const PromoBanner: React.FC<PromoBannerProps> = ({ banners }) => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];

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
    </div>
  );
};

export default PromoBanner;
