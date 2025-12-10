import React from 'react';

const PromoBanner: React.FC = () => {
  return (
    <div className="relative h-[187px] overflow-hidden rounded-[20px]">
      <img
        src="/images/banner-7d753c.png"
        alt="Banner"
        className="w-full h-full object-cover"
      />
      <div className="absolute top-4 left-5">
        <div className="bg-green rounded-[30px] px-4 py-2 inline-block">
          <span className="text-white font-raleway text-xs font-medium">Акция</span>
        </div>
      </div>
      <div className="absolute bottom-8 left-12">
        <h2 className="text-white font-raleway text-[30px] font-bold drop-shadow-custom">
          101 ромашка за 2999
        </h2>
      </div>
    </div>
  );
};

export default PromoBanner;
