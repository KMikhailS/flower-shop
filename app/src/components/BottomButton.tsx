import React from 'react';

interface BottomButtonProps {
  cartItemCount: number;
  onClick: () => void;
}

const BottomButton: React.FC<BottomButtonProps> = ({ cartItemCount, onClick }) => {
  return (
    <div className="px-7 pb-6">
      <button
        onClick={onClick}
        className="w-full bg-teal rounded-[30px] py-5 shadow-custom hover:bg-opacity-90 transition-opacity flex items-center justify-center"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
            <path fill="#000000" d="M14 13.1V12H4.6l.6-1.1l9.2-.9L16 4H3.7L3 1H0v1h2.2l2.1 8.4L3 13v1.5c0 .8.7 1.5 1.5 1.5S6 15.3 6 14.5S5.3 13 4.5 13H12v1.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5c0-.7-.4-1.2-1-1.4z"/>
          </svg>
          {cartItemCount > 0 && (
            <div className="absolute top-[-7px] right-[-11px] w-[15px] h-[15px] rounded-full bg-[#FF0000] flex items-center justify-center">
              <span className="text-white text-[10px] font-normal leading-[1.21]">{cartItemCount}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export default BottomButton;
