'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { usePersistentState } from '@/lib/usePersistentStorage';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
  // Whether this item is included at checkout. Absent/true = included; only
  // an explicit false excludes it. Lets shoppers keep several items in the
  // cart but check out with just one, without removing the rest.
  selected?: boolean;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  removeSelected: () => void;
  totalItems: number;
  totalPrice: number;
  selectedItems: CartItem[];
  selectedCount: number;
  selectedPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const isSelected = (item: CartItem) => item.selected !== false;

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'ogp_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems, isHydrated] = usePersistentState<CartItem[]>(CART_KEY, []);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleSelected = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, selected: !isSelected(i) } : i)));
  };

  const selectAll = () => {
    setItems((prev) => prev.map((i) => ({ ...i, selected: true })));
  };

  // Called after a successful order: drops only the items that were checked
  // out, leaving anything the shopper had deselected still in the cart.
  const removeSelected = () => {
    setItems((prev) => prev.filter((i) => !isSelected(i)));
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedItems = items.filter(isSelected);
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const selectedPrice = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: isHydrated ? items : [],
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleSelected,
        selectAll,
        removeSelected,
        totalItems: isHydrated ? totalItems : 0,
        totalPrice: isHydrated ? totalPrice : 0,
        selectedItems: isHydrated ? selectedItems : [],
        selectedCount: isHydrated ? selectedCount : 0,
        selectedPrice: isHydrated ? selectedPrice : 0,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}