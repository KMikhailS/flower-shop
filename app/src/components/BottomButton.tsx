import React from 'react';

const BottomButton: React.FC = () => {
  return (
    <div className="px-7 pb-6">
      <button className="w-full bg-teal rounded-[30px] py-5 shadow-custom hover:bg-opacity-90 transition-opacity">
        <span className="text-white font-raleway text-base font-medium">
          Заказать
        </span>
      </button>
    </div>
  );
};

export default BottomButton;
