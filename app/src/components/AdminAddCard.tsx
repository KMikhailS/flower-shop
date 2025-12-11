import React from 'react';

interface AdminAddCardProps {
  onClick: () => void;
}

const AdminAddCard: React.FC<AdminAddCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="rounded-[20px] h-[200px] cursor-pointer border-2 border-dashed border-gray-medium flex items-center justify-center bg-gray-light hover:bg-gray-200 transition-colors"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 10V38M10 24H38"
          stroke="#A09CAB"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default AdminAddCard;
