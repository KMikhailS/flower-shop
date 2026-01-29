import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllGoods, fetchGoods, GoodDTO } from '../api/client';
import type { Product } from '../types/product';
import { useDebounce } from './useDebounce';

interface UseProductsOptions {
  userMode?: string;
  initData?: string;
}

export const useProducts = ({ userMode, initData }: UseProductsOptions) => {
  const [activeCategory, setActiveCategory] = useState<string[]>(['all']);
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const isAdminMode = userMode === 'ADMIN' && Boolean(initData);

  const { data: goods = [], error, refetch } = useQuery<GoodDTO[]>({
    queryKey: ['goods', isAdminMode ? 'admin' : 'public', initData],
    queryFn: () => (isAdminMode ? fetchAllGoods(initData as string) : fetchGoods()),
    enabled: isAdminMode ? Boolean(initData) : true,
  });

  useEffect(() => {
    if (!error) return;
    console.error('Failed to fetch goods:', error);
  }, [error]);

  const products = useMemo<Product[]>(() => {
    const mappedProducts = goods.map((good: GoodDTO) => {
      const sortedImages = (good.images || [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map(img => img.image_url);

      return {
        id: good.id,
        image: sortedImages[0] || '/images/placeholder.png',
        images: sortedImages,
        alt: good.name,
        title: good.name,
        price: good.price,
        non_discount_price: good.non_discount_price ?? undefined,
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

    return mappedProducts;
  }, [goods]);

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
    reloadProducts: refetch,
  };
};

export default useProducts;
