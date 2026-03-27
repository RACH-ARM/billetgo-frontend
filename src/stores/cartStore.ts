import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Event, TicketCategory } from '../types/event';

interface CartItem {
  category: TicketCategory;
  quantity: number;
}

interface CartState {
  event: Event | null;
  items: CartItem[];
  buyerInfo: { name: string; email: string; phone: string } | null;
  selectedProvider: 'AIRTEL_MONEY' | 'MOOV_MONEY' | null;
  paymentPhone: string;

  setEvent: (event: Event) => void;
  addItem: (category: TicketCategory, quantity: number) => void;
  removeItem: (categoryId: string) => void;
  updateQuantity: (categoryId: string, quantity: number) => void;
  setBuyerInfo: (info: { name: string; email: string; phone: string }) => void;
  setProvider: (provider: 'AIRTEL_MONEY' | 'MOOV_MONEY') => void;
  setPaymentPhone: (phone: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  event: null,
  items: [],
  buyerInfo: null,
  selectedProvider: null,
  paymentPhone: '',

  setEvent: (event) => set({ event, items: [] }),

  addItem: (category, quantity) => {
    const { items } = get();
    const existing = items.find((i) => i.category.id === category.id);
    if (existing) {
      set({ items: items.map((i) => i.category.id === category.id ? { ...i, quantity } : i) });
    } else {
      set({ items: [...items, { category, quantity }] });
    }
  },

  removeItem: (categoryId) => set({ items: get().items.filter((i) => i.category.id !== categoryId) }),

  updateQuantity: (categoryId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(categoryId);
      return;
    }
    set({ items: get().items.map((i) => i.category.id === categoryId ? { ...i, quantity } : i) });
  },

  setBuyerInfo: (info) => set({ buyerInfo: info }),
  setProvider: (provider) => set({ selectedProvider: provider }),
  setPaymentPhone: (phone) => set({ paymentPhone: phone }),

  clearCart: () => set({ event: null, items: [], buyerInfo: null, selectedProvider: null, paymentPhone: '' }),

  getTotalAmount: () => get().items.reduce((acc, item) => acc + item.category.price * item.quantity, 0),
  getTotalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    {
      name: 'billetgo-cart',
      storage: {
        getItem: (key) => { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; },
        setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => localStorage.removeItem(key),
      },
    }
  )
);
