import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { logoutAdminAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { adminRoleLabels } from "@/lib/auth/permissions";
import type { AuthenticatedAdmin } from "@/lib/auth/session";

type AdminLayoutProps = {
  children: ReactNode;
  admin: AuthenticatedAdmin;
};

export function AdminLayout({ children, admin }: AdminLayoutProps) {
  return (
    <main className="min-h-screen bg-[#050b0d] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        {/* Sidebar solidaire du scroll de la page : un seul contexte de défilement,
            et le fond de colonne couvre toute la hauteur (pas de vide). */}
        <aside className="border-b border-white/10 bg-[#071112] p-5 lg:border-b-0 lg:border-r">
          <BrandLogo size="admin" tone="light" />
          <AdminNav role={admin.role} />
        </aside>
        <section className="p-5 md:p-8">
          <div className="mb-8 flex flex-col items-start gap-3 rounded-card border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-sm font-bold text-white">{admin.name}</span>
              <p className="mt-1 text-xs text-white/[0.56]">
                {admin.email} - {adminRoleLabels[admin.role]}
              </p>
            </div>
            <form action={logoutAdminAction}>
              <Button variant="lightOutline" size="sm" type="submit">
                <LogOut size={16} />
                Deconnexion
              </Button>
            </form>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
