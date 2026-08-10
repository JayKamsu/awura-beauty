"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_BRAND,
  type SiteBrandSettings,
} from "@/lib/domain/site-brand";

type BrandContextValue = {
  settings: SiteBrandSettings;
  loading: boolean;
};

const BrandContext = createContext<BrandContextValue>({
  settings: DEFAULT_SITE_BRAND,
  loading: true,
});

/** Fournit les réglages de marque (chargés depuis l'API) à l'arbre de composants enfants. */
export function BrandSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteBrandSettings>(DEFAULT_SITE_BRAND);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/brand")
      .then((r) => r.json())
      .then((json: { settings?: SiteBrandSettings }) => {
        if (!mounted) return;
        if (json.settings) setSettings(json.settings);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <BrandContext.Provider value={{ settings, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

/** Accède aux réglages de marque courants et à leur état de chargement. */
export function useBrandSettings() {
  return useContext(BrandContext);
}
