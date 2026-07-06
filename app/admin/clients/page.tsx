import {
  CustomerLevel,
  CustomerRelationshipStatus,
  CustomerSource,
  CustomerType,
} from "@prisma/client";
import Link from "next/link";
import { Eye, Pencil, Plus, ShoppingCart } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
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
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  customerLevelLabels,
  customerRelationshipStatusLabels,
  customerSourceLabels,
  customerTypeLabels,
} from "@/lib/admin/labels";
import {
  getAdminClientsPage,
} from "@/lib/services/admin-clients";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("customers");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const filters = {
    q: getSingleQuery(params.q),
    type: getCustomerType(params.type),
    level: getCustomerLevel(params.level),
    relationshipStatus: getCustomerRelationshipStatus(params.relationshipStatus),
    source: getCustomerSource(params.source),
    city: getSingleQuery(params.city),
    page: pagination.page,
    perPage: pagination.perPage,
  };
  const clients = await getAdminClientsPage(filters, pagination);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="CRM"
          title="Clients"
          description="Mini CRM Nahda Smart: relation client, historique achats, notes internes et commandes manuelles."
          action={
            <Link href="/admin/clients/nouveau">
              <Button variant="primary" size="sm">
                <Plus size={16} />
                Nouveau client
              </Button>
            </Link>
          }
        />

        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel title="Filtres CRM">
          <AdminFilterBar columns="xl:grid-cols-[1.5fr_repeat(5,minmax(0,1fr))_auto]">
            <AdminSearchBox
              placeholder="Nom, telephone, email, organisation..."
              defaultValue={filters.q}
            />
            <AdminSelect name="type" defaultValue={filters.type}>
              <option value="">Tous types</option>
              {Object.values(CustomerType).map((type) => (
                <option key={type} value={type}>
                  {customerTypeLabels[type]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="level" defaultValue={filters.level}>
              <option value="">Tous niveaux</option>
              {Object.values(CustomerLevel).map((level) => (
                <option key={level} value={level}>
                  {customerLevelLabels[level]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              name="relationshipStatus"
              defaultValue={filters.relationshipStatus}
            >
              <option value="">Tous statuts</option>
              {Object.values(CustomerRelationshipStatus).map((status) => (
                <option key={status} value={status}>
                  {customerRelationshipStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect name="source" defaultValue={filters.source}>
              <option value="">Toutes sources</option>
              {Object.values(CustomerSource).map((source) => (
                <option key={source} value={source}>
                  {customerSourceLabels[source]}
                </option>
              ))}
            </AdminSelect>
            <input
              name="city"
              defaultValue={filters.city}
              placeholder="Ville"
              className="h-10 rounded-control border border-white/10 bg-[#0c1718] px-3 text-sm font-semibold text-white outline-none placeholder:text-white/34 focus:border-nahda-olive/70"
            />
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </AdminFilterBar>
        </AdminPanel>

        <AdminPanel title={`${clients.total} clients`}>
          {clients.items.length ? (
            <>
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Relation</th>
                    <th className="px-3 py-3">Type / source</th>
                    <th className="px-3 py-3">Ville</th>
                    <th className="px-3 py-3">Commandes</th>
                    <th className="px-3 py-3">Total depense</th>
                    <th className="px-3 py-3">Dernier achat</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </AdminTableHead>
                <tbody className="divide-y divide-white/10">
                  {clients.items.map((client) => (
                    <tr key={client.id}>
                      <AdminTableCell>
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="font-black text-white hover:text-nahda-olive"
                        >
                          {client.name}
                        </Link>
                        <p className="mt-1 text-xs text-white/44">
                          {client.phone}
                        </p>
                        {client.email ? (
                          <p className="mt-1 text-xs text-white/38">
                            {client.email}
                          </p>
                        ) : null}
                        {client.organizationName ? (
                          <p className="mt-1 text-xs text-white/38">
                            {client.organizationName}
                          </p>
                        ) : null}
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex flex-col gap-2">
                          <AdminStatusBadge tone={client.relationshipTone}>
                            {client.relationshipStatusLabel}
                          </AdminStatusBadge>
                          <span className="text-xs text-white/44">
                            {client.levelLabel}
                          </span>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <p>{client.typeLabel}</p>
                        <p className="mt-1 text-xs text-white/44">
                          {client.sourceLabel}
                        </p>
                      </AdminTableCell>
                      <AdminTableCell>{client.city ?? "-"}</AdminTableCell>
                      <AdminTableCell>
                        <p className="font-black text-white">
                          {client.orderCount}
                        </p>
                        {client.cancelledOrderCount ? (
                          <p className="text-xs text-red-200">
                            {client.cancelledOrderCount} annulee(s)
                          </p>
                        ) : null}
                      </AdminTableCell>
                      <AdminTableCell>{client.totalSpentLabel}</AdminTableCell>
                      <AdminTableCell>
                        {client.lastOrderAt ?? client.createdAt}
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="inline-flex h-9 items-center gap-1 rounded-control border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/[0.08]"
                          >
                            <Eye size={14} />
                            Voir
                          </Link>
                          <Link
                            href={`/admin/clients/${client.id}/modifier`}
                            className="inline-flex h-9 items-center gap-1 rounded-control border border-white/10 px-3 text-xs font-bold text-white hover:bg-white/[0.08]"
                          >
                            <Pencil size={14} />
                            Modifier
                          </Link>
                          <Link
                            href={`/admin/clients/${client.id}/nouvelle-commande`}
                            className="inline-flex h-9 items-center gap-1 rounded-control bg-nahda-olive px-3 text-xs font-bold text-white hover:bg-nahda-olive-dark"
                          >
                            <ShoppingCart size={14} />
                            Commande
                          </Link>
                        </div>
                      </AdminTableCell>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <AdminPagination
                basePath="/admin/clients"
                searchParams={params}
                page={clients.page}
                perPage={clients.perPage}
                total={clients.total}
                totalPages={clients.totalPages}
              />
            </>
          ) : (
            <AdminEmptyState
              title="Aucun client trouve"
              description="Ajustez les filtres ou creez un client depuis le bouton Nouveau client."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getCustomerType(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single && Object.values(CustomerType).includes(single as CustomerType)
    ? (single as CustomerType)
    : undefined;
}

function getCustomerLevel(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single && Object.values(CustomerLevel).includes(single as CustomerLevel)
    ? (single as CustomerLevel)
    : undefined;
}

function getCustomerRelationshipStatus(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single &&
    Object.values(CustomerRelationshipStatus).includes(
      single as CustomerRelationshipStatus,
    )
    ? (single as CustomerRelationshipStatus)
    : undefined;
}

function getCustomerSource(value: string | string[] | undefined) {
  const single = getSingleQuery(value);
  return single && Object.values(CustomerSource).includes(single as CustomerSource)
    ? (single as CustomerSource)
    : undefined;
}
