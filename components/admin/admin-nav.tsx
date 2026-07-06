"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  DollarSign,
  FileText,
  FolderTree,
  Funnel,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Star,
  ReceiptText,
  Tags,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  canAccessAdminSection,
  type AdminSection,
} from "@/lib/auth/permissions";
import type { AdminRole } from "@prisma/client";

const adminNav: Array<{
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  section: AdminSection | null;
}> = [
  { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard, section: null },
  { label: "Commandes", href: "/admin/commandes", icon: ShoppingCart, section: "orders" },
  { label: "Devis", href: "/admin/devis", icon: FileText, section: "quotes" },
  { label: "Leads & contacts", href: "/admin/contacts", icon: MessageSquare, section: "contacts" },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail, section: "contacts" },
  { label: "Clients", href: "/admin/clients", icon: Users, section: "customers" },
  { label: "SAV", href: "/admin/sav", icon: Wrench, section: "sav" },
  { label: "Produits", href: "/admin/produits", icon: Package, section: "products" },
  { label: "Avis clients", href: "/admin/avis", icon: Star, section: "products" },
  { label: "Categories", href: "/admin/categories", icon: FolderTree, section: "categories" },
  { label: "Marques", href: "/admin/marques", icon: Tags, section: "brands" },
  { label: "Filtres", href: "/admin/filtres", icon: Funnel, section: "filters" },
  { label: "Stock", href: "/admin/stock", icon: Boxes, section: "stock" },
  { label: "Depots", href: "/admin/depots", icon: Boxes, section: "depots" },
  { label: "Fournisseurs", href: "/admin/fournisseurs", icon: Building2, section: "suppliers" },
  { label: "Achats fournisseurs", href: "/admin/achats-fournisseurs", icon: ReceiptText, section: "suppliers" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, section: "reports" },
  { label: "Finance", href: "/admin/finance", icon: DollarSign, section: "revenues" },
  { label: "Logs admin", href: "/admin/logs", icon: ClipboardList, section: "logs" },
  { label: "Parametres", href: "/admin/parametres", icon: Settings, section: "settings" },
];

export function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 grid gap-1.5">
      {adminNav.map((item) => {
        const allowed =
          item.section === null || canAccessAdminSection(role, item.section);
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const className = cn(
          "group flex items-center gap-3 rounded-control px-4 py-3 text-sm font-bold transition",
          allowed
            ? "text-white/[0.64] hover:bg-white/[0.07] hover:text-white"
            : "cursor-not-allowed text-white/25",
          isActive &&
            allowed &&
            "bg-nahda-olive text-white shadow-[0_12px_34px_rgb(85_114_15_/_0.24)] hover:bg-nahda-olive",
        );

        if (!allowed) {
          return (
            <span key={item.label} className={className}>
              <item.icon size={18} />
              <span className="truncate">{item.label}</span>
            </span>
          );
        }

        return (
          <Link key={item.label} href={item.href} className={className}>
            <item.icon size={18} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
