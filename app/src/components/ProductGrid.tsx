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

export const products: Product[] = [
  {
    id: 1,
    image: '/images/flower-4-1bbae9.png',
    alt: 'Flower 1',
    title: 'Авторская композиция "Сияние"',
    price: '2999 руб.',
    description: 'Букет "Сияние" — это гармоничное сочетание свежих цветов, созданное, чтобы приносить свет и радость в любой день. Его яркие и нежные оттенки наполняют атмосферу позитивом, дарят улыбки и создают настроение праздника.'
  },
  {
    id: 2,
    image: '/images/flower-3.png',
    alt: 'Flower 2',
    title: 'Композиция "Нежность"',
    price: '2499 руб.',
    description: 'Элегантный букет с пастельными оттенками, который подарит ощущение спокойствия и гармонии.'
  },
  {
    id: 3,
    image: '/images/flower-2-964b74.png',
    alt: 'Flower 3',
    title: 'Букет "Романтика"',
    price: '3499 руб.',
    description: 'Изысканная композиция для особых моментов, наполненная романтикой и нежностью.'
  },
  {
    id: 4,
    image: '/images/flower-1-59d765.png',
    alt: 'Flower 4',
    title: 'Композиция "Весна"',
    price: '2799 руб.',
    description: 'Свежий и яркий букет, который принесет весеннее настроение в любое время года.'
  },
];

interface ProductGridProps {
  onProductClick?: (product: Product) => void;
  isAdminMode?: boolean;
  onAddNewCard?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductClick, isAdminMode, onAddNewCard }) => {
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
