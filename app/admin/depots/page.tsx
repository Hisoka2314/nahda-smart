import Link from "next/link";
import { DepotType } from "@prisma/client";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminCheckbox,
  AdminFeedback,
  AdminField,
  AdminFilterBar,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminSearchBox,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTextInput,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { depotTypeLabels } from "@/lib/admin/labels";
import { getAdminDepotsPage } from "@/lib/services/admin-depots";
import {
  createDepotAction,
  updateDepotAction,
} from "@/app/admin/depots/actions";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminDepotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("depots");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    status: getStatus(params.status),
  };
  const depotsPage = await getAdminDepotsPage(filters, pagination);
  const depots = depotsPage.items;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Inventaire"
          title="Depots et locaux"
          description="Gerez les depots, showrooms et magasins utilises par les stocks."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Depots" },
          ]}
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel title="Nouveau depot">
          <form action={createDepotAction} className="grid gap-3 lg:grid-cols-3">
            <AdminField label="Nom">
              <AdminTextInput name="name" required />
            </AdminField>
            <AdminField label="Type">
              <AdminSelect name="type">
                {Object.values(DepotType).map((type) => (
                  <option key={type} value={type}>
                    {depotTypeLabels[type]}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Responsable">
              <AdminTextInput name="managerName" />
            </AdminField>
            <div className="lg:col-span-2">
              <AdminField label="Adresse">
                <AdminTextInput name="address" />
              </AdminField>
            </div>
            <AdminCheckbox name="isActive" label="Actif" defaultChecked />
            <Button type="submit" className="lg:col-span-3">Creer depot</Button>
          </form>
        </AdminPanel>

        <AdminPanel title="Recherche depots">
          <AdminFilterBar columns="lg:grid-cols-[1.4fr_1fr_160px_auto_auto]">
            <AdminSearchBox placeholder="Depot, adresse, responsable..." defaultValue={filters.q} />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </AdminSelect>
            <AdminSelect name="perPage" defaultValue={String(depotsPage.perPage)}>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">Filtrer</Button>
            <Link
              href="/admin/depots"
              className="inline-flex h-9 items-center justify-center rounded-control border border-white/10 px-3 text-sm font-bold text-white/68 hover:bg-white/[0.08]"
            >
              Reset
            </Link>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel title={`${depotsPage.total} depots`}>
          <AdminTable>
            <AdminTableHead>
              <tr>
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Adresse</th>
                <th className="px-3 py-3">Responsable</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3">Modifie</th>
              </tr>
            </AdminTableHead>
            <tbody className="divide-y divide-white/10">
              {depots.map((depot) => (
                <tr key={depot.id}>
                  <AdminTableCell className="font-black text-white">{depot.name}</AdminTableCell>
                  <AdminTableCell>{depot.typeLabel}</AdminTableCell>
                  <AdminTableCell>{depot.address || "-"}</AdminTableCell>
                  <AdminTableCell>{depot.managerName || "-"}</AdminTableCell>
                  <AdminTableCell>{depot.stockTotal} unites / {depot.productCount} produits</AdminTableCell>
                  <AdminTableCell>
                    <AdminStatusBadge tone={depot.isActive ? "success" : "muted"}>
                      {depot.isActive ? "Actif" : "Inactif"}
                    </AdminStatusBadge>
                  </AdminTableCell>
                  <AdminTableCell>{depot.updatedAt}</AdminTableCell>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <AdminPagination
            basePath="/admin/depots"
            searchParams={params}
            page={depotsPage.page}
            perPage={depotsPage.perPage}
            total={depotsPage.total}
            totalPages={depotsPage.totalPages}
          />
        </AdminPanel>

        <AdminPanel
          title="Edition rapide"
          description="Modifier un depot sans ouvrir une page separee. Les changements sont journalises."
        >
          <div className="grid gap-3">
            {depots.map((depot) => (
              <form
                key={depot.id}
                action={updateDepotAction}
                className="grid gap-2 rounded-control border border-white/10 bg-white/[0.035] p-3 lg:grid-cols-[1fr_180px_1fr_1fr_auto_auto]"
              >
                <input type="hidden" name="id" value={depot.id} />
                <input type="hidden" name="returnTo" value="/admin/depots" />
                <AdminTextInput name="name" defaultValue={depot.name} />
                <AdminSelect name="type" defaultValue={depot.type}>
                  {Object.values(DepotType).map((type) => (
                    <option key={type} value={type}>
                      {depotTypeLabels[type]}
                    </option>
                  ))}
                </AdminSelect>
                <AdminTextInput name="address" defaultValue={depot.address} />
                <AdminTextInput name="managerName" defaultValue={depot.managerName} />
                <AdminCheckbox name="isActive" label="Actif" defaultChecked={depot.isActive} />
                <Button type="submit" variant="lightOutline">Enregistrer</Button>
              </form>
            ))}
          </div>
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getStatus(
  value: string | string[] | undefined,
): "active" | "inactive" | undefined {
  const single = getSingleQuery(value);
  return single === "active" || single === "inactive" ? single : undefined;
}
