"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SkipLink } from "@/components/a11y/skip-link";
import { BrandSettingsProvider, useBrandSettings } from "@/components/brand/brand-settings-provider";
import { DuafePattern } from "@/components/brand/duafe-pattern";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { VisitTracker } from "@/components/layout/visit-tracker";
import { PushForegroundListener } from "@/features/notifications/components/push-foreground-listener";
import { PushNavigateListener } from "@/features/notifications/components/push-navigate-listener";
import { PushOptIn } from "@/features/notifications/components/push-opt-in";
import { PwaInstallControls } from "@/features/pwa/components/pwa-install-controls";
import { CatalogLiveSync } from "@/features/shop/components/catalog-live-sync";
import { SupportChatWidget } from "@/features/support-chat/components/support-chat-widget";

type SiteShellProps = {
  children: ReactNode;
};

/** Mesure le bandeau + header pour que le hero occupe exactement le reste de l'écran. */
function ChromeTop({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      document.documentElement.style.setProperty(
        "--awura-chrome-top",
        `${el.offsetHeight}px`,
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--awura-chrome-top");
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

function PublicShell({ children }: { children: ReactNode }) {
  const { settings } = useBrandSettings();

  return (
    <>
      <SkipLink />
      <div className="relative flex min-h-full flex-1 flex-col">
        <DuafePattern enabled={settings.showDuafePattern} />
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          <ChromeTop>
            <AnnouncementBar />
            <Header />
          </ChromeTop>
          <div
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 flex-col outline-none pb-20 lg:pb-0"
          >
            {children}
          </div>
          <Footer />
          <MobileBottomNav />
        </div>
      </div>
      <PushForegroundListener />
      <PushNavigateListener />
      <PushOptIn />
      <PwaInstallControls variant="banner" />
      <SupportChatWidget />
      <CatalogLiveSync />
      <VisitTracker />
    </>
  );
}

/** Structure racine de la mise en page : choisit l'habillage admin ou public et fournit les réglages de marque. */
export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <BrandSettingsProvider>
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </BrandSettingsProvider>
    );
  }

  return (
    <BrandSettingsProvider>
      <PublicShell>{children}</PublicShell>
    </BrandSettingsProvider>
  );
}
