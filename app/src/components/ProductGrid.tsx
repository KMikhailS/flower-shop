import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdminAddCard from './AdminAddCard';
import ProductGridCard from './ProductGridCard';
import type { Product } from '../types/product';

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  isAdminMode?: boolean;
  onAddNewCard?: () => void;
}

const PAGE_SIZE = 20;

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick, isAdminMode, onAddNewCard }) => {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(PAGE_SIZE, products.length));
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, products.length));
  }, [products]);

  const canLoadMore = visibleCount < products.length;
  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  useEffect(() => {
    if (!canLoadMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, products.length));
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, products.length]);

  return (
    <div className="grid grid-cols-2 gap-[21px] px-8">
      {visibleProducts.map((product, index) => (
        <ProductGridCard
          key={product.id}
          product={product}
          onClick={onProductClick}
          isPriority={index < 4}
        />
      ))}
      {isAdminMode && onAddNewCard && !canLoadMore && (
        <AdminAddCard onClick={onAddNewCard} />
      )}
      {canLoadMore && (
        <div ref={loadMoreRef} className="col-span-2 h-1" aria-hidden />
      )}
    </div>
  );
};

export default React.memo(ProductGrid);
