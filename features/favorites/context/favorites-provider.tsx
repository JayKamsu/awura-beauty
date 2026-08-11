"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/context/auth-provider";

type FavoritesContextValue = {
  productIds: string[];
  hydrated: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
};

const FAVORITES_KEY = "awura-favorites";
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readLocalFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Fournit les favoris à l'arbre React : stockés en localStorage pour un visiteur
 * non connecté, synchronisés avec le compte (fusion, jamais de suppression
 * distante) dès la connexion, puis persistés côté serveur pour un client connecté.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  // Hydratation initiale (localStorage), avant toute résolution de session.
  useEffect(() => {
    setProductIds(readLocalFavorites());
    setHydrated(true);
  }, []);

  // Visiteur non connecté : on garde localStorage à jour.
  useEffect(() => {
    if (!hydrated || user) return;
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(productIds));
  }, [productIds, hydrated, user]);

  // Connexion : fusionne les favoris locaux dans le compte, puis bascule en
  // source de vérité serveur.
  useEffect(() => {
    if (!hydrated || !user || !session?.access_token) return;
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    void (async () => {
      const local = readLocalFavorites();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };

      const res = await fetch("/api/account/favorites", {
        method: "POST",
        headers,
        body: JSON.stringify({ productIds: local }),
      });

      if (res.ok) {
        const json = (await res.json()) as { productIds?: string[] };
        setProductIds(json.productIds ?? local);
        window.localStorage.removeItem(FAVORITES_KEY);
        return;
      }

      const fallback = await fetch("/api/account/favorites", { headers });
      if (fallback.ok) {
        const json = (await fallback.json()) as { productIds?: string[] };
        setProductIds(json.productIds ?? []);
      }
    })();
  }, [hydrated, user, session?.access_token]);

  // Déconnexion : repart d'une liste locale vide (pas de fuite entre comptes).
  useEffect(() => {
    if (!user) mergedForUser.current = null;
  }, [user]);

  const toggleFavorite = useCallback(
    (productId: string) => {
      setProductIds((current) => {
        const isFav = current.includes(productId);
        const next = isFav
          ? current.filter((id) => id !== productId)
          : [...current, productId];

        if (user && session?.access_token) {
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          };
          if (isFav) {
            void fetch(`/api/account/favorites?productId=${encodeURIComponent(productId)}`, {
              method: "DELETE",
              headers,
            });
          } else {
            void fetch("/api/account/favorites", {
              method: "POST",
              headers,
              body: JSON.stringify({ productId }),
            });
          }
        }

        return next;
      });
    },
    [user, session],
  );

  const isFavorite = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ productIds, hydrated, isFavorite, toggleFavorite }),
    [productIds, hydrated, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

/** Accès aux favoris courants ; doit être utilisé sous un FavoritesProvider. */
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
