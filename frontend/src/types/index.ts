export type OrderStatus = 'pending' | 'confirmed' | 'served' | 'completed';

export interface Table {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  displayOrder: number;
  categoryId: string;
  category?: Category;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: { name: string };
  quantity: number;
  priceAtOrder: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  table: { name: string };
  status: OrderStatus;
  notes?: string;
  orderedAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  notes?: string;
}
