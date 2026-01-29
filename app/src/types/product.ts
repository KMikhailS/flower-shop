export interface Product {
  id: number;
  image: string;
  images?: string[];
  alt: string;
  title: string;
  price: number;
  non_discount_price?: number;
  description: string;
  category?: string;
  status?: string;
  sort_order?: number;
}
