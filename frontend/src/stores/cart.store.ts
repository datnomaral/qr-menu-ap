import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
  tableId: string | null;
  items: CartItem[];
  orderNotes: string;
  setTableId: (id: string) => void;
  setOrderNotes: (notes: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => boolean;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateItemNotes: (menuItemId: string, notes: string) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  totalQuantity: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  tableId: sessionStorage.getItem('tableId'),
  items: [],
  orderNotes: '',

  setTableId: (id: string) => {
    sessionStorage.setItem('tableId', id);
    set({ tableId: id });
  },

  setOrderNotes: (notes: string) => set({ orderNotes: notes }),

  // Returns false if item is not available (isAvailable must be checked before calling)
  addItem: (item: Omit<CartItem, 'quantity'>) => {
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, 999);
        return {
          items: state.items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: newQty } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1, notes: '' }] };
    });
    return true;
  },

  updateQuantity: (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    const capped = Math.min(quantity, 999);
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: capped } : i
      ),
    }));
  },

  updateItemNotes: (menuItemId: string, notes: string) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, notes } : i
      ),
    }));
  },

  removeItem: (menuItemId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.menuItemId !== menuItemId),
    }));
  },

  clearCart: () => set({ items: [], orderNotes: '' }),

  totalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  totalPrice: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
