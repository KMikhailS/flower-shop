import React, { useCallback, useMemo } from 'react';

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
  const allCategories: Category[] = useMemo(() => ([
    { id: 'all', label: 'Все' },
    ...categories.map(cat => ({ id: cat, label: cat }))
  ]), [categories]);

  const handleCategoryClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const categoryId = event.currentTarget.dataset.categoryId;
    if (!categoryId) return;
    onCategoryChange(categoryId);
  }, [onCategoryChange]);

  return (
    <div className="flex gap-[13px] px-8 overflow-x-auto scrollbar-hide pb-2">
      {allCategories.map((category) => (
        <button
          key={category.id}
          data-category-id={category.id}
          onClick={handleCategoryClick}
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

export default React.memo(CategoryTabs);
