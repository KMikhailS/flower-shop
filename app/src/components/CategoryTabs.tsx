import React from 'react';

interface Category {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string[];
  onCategoryChange: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onCategoryChange }) => {
  // Build categories array: "Все" (all) first, then dynamic categories
  const allCategories: Category[] = [
    { id: 'all', label: 'Все' },
    ...categories.map(cat => ({ id: cat, label: cat }))
  ];

  return (
    <div className="flex gap-[13px] px-8 overflow-x-auto scrollbar-hide pb-2">
      {allCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`
            rounded-[30px] px-5 py-2.5 whitespace-nowrap shadow-custom transition-colors
            ${
              activeCategory.includes(category.id)
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
