import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ menuId, name, price, qty }]

  const addItem = (menu) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuId === menu.id);
      if (existing) {
        return prev.map((i) => (i.menuId === menu.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { menuId: menu.id, name: menu.name, price: menu.price, qty: 1 }];
    });
  };

  const updateQty = (menuId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.menuId !== menuId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.menuId === menuId ? { ...i, qty } : i)));
  };

  const removeItem = (menuId) => {
    setItems((prev) => prev.filter((i) => i.menuId !== menuId));
  };

  const clear = () => setItems([]);

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items]);

  const getQty = (menuId) => items.find((i) => i.menuId === menuId)?.qty || 0;

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clear, totalCount, total, getQty }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
