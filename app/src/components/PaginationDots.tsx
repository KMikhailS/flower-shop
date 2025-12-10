import React, { useState } from 'react';

const PaginationDots: React.FC = () => {
  const [activeDot, setActiveDot] = useState(0);
  const totalDots = 4;

  return (
    <div className="flex justify-center items-center gap-2.5">
      {Array.from({ length: totalDots }).map((_, index) => (
        <button
          key={index}
          onClick={() => setActiveDot(index)}
          className={`
            rounded-full transition-all
            ${
              activeDot === index
                ? 'w-2.5 h-2.5 bg-[#898989]'
                : 'w-2 h-2 bg-[#FFF5F5]'
            }
          `}
        />
      ))}
    </div>
  );
};

export default PaginationDots;
