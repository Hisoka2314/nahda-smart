import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { CaisseClient } from "@/components/admin/caisse-client";
import { encaisserVenteAction } from "@/app/admin/caisse/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  getArticlesCaisse,
  getClientComptoir,
  getClientsCaisse,
  getDepotsCaisse,
} from "@/lib/services/admin-caisse";

export const dynamic = "force-dynamic";

export default async function AdminCaissePage() {
  const admin = await requireAdminSection("orders");

  const [articles, depots, clients, comptoir] = await Promise.all([
    getArticlesCaisse(),
    getDepotsCaisse(),
    getClientsCaisse(),
    getClientComptoir(),
  ]);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Vente"
          title="Caisse"
          description={`${articles.length} articles scannables — le stock se met a jour a l'encaissement.`}
        />

        {depots.length === 0 ? (
          <p className="rounded-card border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
            Aucun depot actif : creez-en un avant de vendre, le stock ne peut
            pas etre decremente sans lui.
          </p>
        ) : (
          <CaisseClient
            articles={articles}
            depots={depots}
            clients={clients}
            clientComptoirId={comptoir.id}
            encaisser={encaisserVenteAction}
          />
        )}
      </div>
    </AdminLayout>
  );
}
