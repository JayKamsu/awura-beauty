"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SkipLink } from "@/components/a11y/skip-link";
import { BrandSettingsProvider, useBrandSettings } from "@/components/brand/brand-settings-provider";
import { DuafePattern } from "@/components/brand/duafe-pattern";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PushForegroundListener } from "@/features/notifications/components/push-foreground-listener";
import { PushNavigateListener } from "@/features/notifications/components/push-navigate-listener";
import { PushOptIn } from "@/features/notifications/components/push-opt-in";
import { PwaInstallControls } from "@/features/pwa/components/pwa-install-controls";
import { SupportChatWidget } from "@/features/support-chat/components/support-chat-widget";

type SiteShellProps = {
  children: ReactNode;
};

function PublicShell({ children }: { children: ReactNode }) {
  const { settings } = useBrandSettings();

  return (
    <>
      <SkipLink />
      <div className="relative flex min-h-full flex-1 flex-col">
        <DuafePattern enabled={settings.showDuafePattern} />
        <div className="relative z-[1] flex min-h-full flex-1 flex-col">
          <AnnouncementBar />
          <Header />
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
    </>
  );
}

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
