import React from 'react';
import AdminAddCard from './AdminAddCard';

export interface Product {
  id: number;
  image: string;
  images?: string[];
  alt: string;
  title: string;
  price: string;
  description: string;
  category?: string;
  status?: string;
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
          className="relative rounded-[20px] overflow-hidden h-[200px] cursor-pointer"
          onClick={() => onProductClick?.(product)}
        >
          <img
            src={product.image}
            alt={product.alt}
            className="w-full h-full object-cover"
          />
          {product.status === 'BLOCKED' && (
            <div className="absolute top-2 left-2 bg-gray-medium bg-opacity-90 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Не активен
            </div>
          )}
        </div>
      ))}
      {isAdminMode && onAddNewCard && (
        <AdminAddCard onClick={onAddNewCard} />
      )}
    </div>
  );
};

export default ProductGrid;
