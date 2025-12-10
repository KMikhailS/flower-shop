import React from 'react';

const SearchBar: React.FC = () => {
  return (
    <div className="px-4">
      <div className="bg-gray-light rounded-[32px] px-4 py-3 flex items-center gap-2">
        <img src="/images/search.svg" alt="Search" className="w-6 h-6" />
        <input
          type="text"
          placeholder="Поиск версия 0.56"
          className="bg-transparent flex-1 outline-none font-inter text-base text-gray-medium placeholder:text-gray-medium"
        />
      </div>
    </div>
  );
};

export default SearchBar;
