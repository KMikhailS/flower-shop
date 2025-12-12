import React from 'react';
import AdminAddCard from './AdminAddCard';

export interface Product {
  id: number;
  image: string;
  alt: string;
  title: string;
  price: string;
  description: string;
}

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  isAdminMode?: boolean;
  onAddNewCard?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick, isAdminMode, onAddNewCard }) => {
  return (
    <div className="grid grid-cols-2 gap-[21px] px-8">
      {products.map((product) => (
        <div
          key={product.id}
          className="rounded-[20px] overflow-hidden h-[200px] cursor-pointer"
          onClick={() => onProductClick?.(product)}
        >
          <img
            src={product.image}
            alt={product.alt}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {isAdminMode && onAddNewCard && (
        <AdminAddCard onClick={onAddNewCard} />
      )}
    </div>
  );
};

export default ProductGrid;
