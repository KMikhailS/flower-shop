import React, { useState } from 'react';

interface Category {
  id: string;
  label: string;
}

const categories: Category[] = [
  { id: 'all', label: 'Все' },
  // { id: 'bouquets', label: 'Букеты' },
  // { id: 'roses', label: 'Розы' },
  // { id: 'vases', label: 'Вазы' },
  // { id: 'exotic', label: 'Экзотика' },
];

const CategoryTabs: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="flex gap-[13px] px-8 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={`
            rounded-[30px] px-5 py-2.5 whitespace-nowrap shadow-custom transition-colors
            ${
              activeCategory === category.id
                ? 'bg-teal'
                : 'bg-[#D9D9D9]'
            }
          `}
        >
          <span className="text-black font-raleway text-xs font-normal">
            {category.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
