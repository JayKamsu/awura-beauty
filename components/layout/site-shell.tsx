"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { PushForegroundListener } from "@/features/notifications/components/push-foreground-listener";
import { PushNavigateListener } from "@/features/notifications/components/push-navigate-listener";
import { PushOptIn } from "@/features/notifications/components/push-opt-in";
import { SupportChatWidget } from "@/features/support-chat/components/support-chat-widget";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <div className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</div>
      <Footer />
      <MobileBottomNav />
      <PushForegroundListener />
      <PushNavigateListener />
      <PushOptIn />
      <SupportChatWidget />
    </>
  );
}
