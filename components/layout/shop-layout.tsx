import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type ShopLayoutProps = {
  children: ReactNode;
};

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col pb-[72px] lg:pb-0">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
