export type Category =
  | 'gear'
  | 'baby'
  | 'sleep'
  | 'feeding'
  | 'nursery'
  | 'toys'
  | 'maternity'
  | 'postpartum'
  | 'nursing'
  | 'wellness';

export type ProductVariant = {
  vid: string;
  sku?: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  image?: string;
  inventory?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: 'USD';
  image: string;
  images?: string[];
  category: Category;
  tags: string[];
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  bestSeller?: boolean;
  cjProductId?: string;
  cjVariantId?: string;
  variants?: ProductVariant[];
  weightG?: number;
};

export type CartItem = {
  productId: string;
  variantId?: string;
  qty: number;
};

export type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  currency: 'USD';
  paymentProvider: 'stripe' | 'paypal';
  paymentId: string;
  shippingAddress: ShippingAddress;
  status: 'paid' | 'fulfilling' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
};
