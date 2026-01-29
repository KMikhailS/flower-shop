import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllGoods, fetchGoods, GoodDTO } from '../api/client';
import type { Product } from '../components/ProductGrid';
import { useDebounce } from './useDebounce';

interface UseProductsOptions {
  userMode?: string;
  initData?: string;
}

export const useProducts = ({ userMode, initData }: UseProductsOptions) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string[]>(['all']);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const loadProducts = useCallback(async () => {
    try {
      let goods: GoodDTO[];

      if (userMode === 'ADMIN' && initData) {
        goods = await fetchAllGoods(initData);
      } else {
        goods = await fetchGoods();
      }

      const mappedProducts: Product[] = goods.map((good: GoodDTO) => {
        const sortedImages = (good.images || [])
          .sort((a, b) => a.display_order - b.display_order)
          .map(img => img.image_url);

        return {
          id: good.id,
          image: sortedImages[0] || '/images/placeholder.png',
          images: sortedImages,
          alt: good.name,
          title: good.name,
          price: `${good.price} руб.`,
          non_discount_price: good.non_discount_price ? `${good.non_discount_price} руб.` : undefined,
          description: good.description,
          category: good.category,
          status: good.status,
          sort_order: good.sort_order ?? good.id,
        };
      });

      mappedProducts.sort((a, b) => {
        const aOrder = a.sort_order ?? a.id;
        const bOrder = b.sort_order ?? b.id;
        return aOrder - bOrder;
      });

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to fetch goods:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      setProducts([]);
    }
  }, [userMode, initData]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setActiveCategory(['all']);
  }, [products]);

  const uniqueCategories = useMemo(() => {
    const categories = products
      .map(p => p.category)
      .filter((cat): cat is string => Boolean(cat));
    return Array.from(new Set(categories));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (!activeCategory.includes('all')) {
      result = result.filter(p => p.category && activeCategory.includes(p.category));
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(p => p.title.toLowerCase().includes(query));
    }

    return result;
  }, [products, activeCategory, debouncedSearchQuery]);

  const handleCategoryToggle = useCallback((category: string) => {
    if (category === 'all') {
      setActiveCategory(['all']);
      return;
    }

    setActiveCategory(prev => {
      const isSelected = prev.includes(category);

      if (isSelected) {
        const newSelection = prev.filter(cat => cat !== category);
        return newSelection.length === 0 ? ['all'] : newSelection;
      }

      const withoutAll = prev.filter(cat => cat !== 'all');
      return [...withoutAll, category];
    });
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    products,
    uniqueCategories,
    filteredProducts,
    activeCategory,
    searchQuery,
    setSearchQuery: updateSearchQuery,
    setActiveCategory,
    handleCategoryToggle,
    reloadProducts: loadProducts,
  };
};

export default useProducts;
