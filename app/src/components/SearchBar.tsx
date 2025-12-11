import React from 'react';

interface SearchBarProps {
  userId?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ userId }) => {
  const placeholder = userId
    ? `Поиск версия 0.57 | ID: ${userId}`
    : 'Поиск версия 0.57';

  return (
    <div className="px-4">
      <div className="bg-gray-light rounded-[32px] px-4 py-3 flex items-center gap-2">
        <img src="/images/search.svg" alt="Search" className="w-6 h-6" />
        <input
          type="text"
          placeholder={placeholder}
          className="bg-transparent flex-1 outline-none font-inter text-base text-gray-medium placeholder:text-gray-medium"
        />
      </div>
    </div>
  );
};

export default SearchBar;
