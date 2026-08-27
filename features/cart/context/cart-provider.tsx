"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Article du panier tel que persisté côté client. */
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  imageUrl: string;
  quantity: number;
  /** Variante couleur choisie, si le produit en propose. */
  colorKey?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (lineKey: string) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  hydrated: boolean;
};

const CART_KEY = "awura-cart";
const CartContext = createContext<CartContextValue | null>(null);

/** Identifiant unique d'une ligne panier (produit + couleur). */
export function cartLineKey(
  item: Pick<CartItem, "productId" | "colorKey">,
): string {
  return item.colorKey ? `${item.productId}:${item.colorKey}` : item.productId;
}

/** Fournit le panier à l'arbre React et le synchronise avec le localStorage du navigateur. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const key = cartLineKey(item);
        const existing = current.find((entry) => cartLineKey(entry) === key);
        if (existing) {
          return current.map((entry) =>
            cartLineKey(entry) === key
              ? { ...entry, quantity: entry.quantity + quantity }
              : entry,
          );
        }
        return [...current, { ...item, quantity }];
      });
    },
    [],
  );

  const removeItem = useCallback((lineKey: string) => {
    setItems((current) =>
      current.filter((entry) => cartLineKey(entry) !== lineKey),
    );
  }, []);

  const setQuantity = useCallback((lineKey: string, quantity: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          cartLineKey(entry) === lineKey
            ? { ...entry, quantity: Math.max(0, quantity) }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    return {
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      hydrated,
    };
  }, [items, addItem, removeItem, setQuantity, clearCart, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Accès au panier courant ; doit être utilisé sous un CartProvider. */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
