import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getAdminPagination, getSingleQuery } from "@/lib/admin/pagination";
import { getAdminLogsPage } from "@/lib/services/admin-logs";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("logs");
  const params = await searchParams;
  const pagination = getAdminPagination({
    page: getSingleQuery(params.page),
    perPage: getSingleQuery(params.perPage),
  });
  const logsPage = await getAdminLogsPage(pagination);
  const logs = logsPage.items;

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Securite"
          title="Logs admin"
          description="Lecture reservee SUPER_ADMIN. Les secrets, tokens et mots de passe ne sont jamais affiches."
        />

        <AdminPanel title={`${logsPage.total} evenements`}>
          {logs.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Admin</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Entite</th>
                  <th className="px-3 py-3">Metadata</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <AdminTableCell>{log.createdAt}</AdminTableCell>
                    <AdminTableCell>
                      <p className="font-bold text-white">
                        {log.adminName ?? "Systeme"}
                      </p>
                      {log.adminEmail ? (
                        <p className="mt-1 text-xs text-white/42">
                          {log.adminEmail}
                        </p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="font-mono text-xs text-nahda-olive">
                        {log.action}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell>
                      <p>{log.entity}</p>
                      {log.entityId ? (
                        <p className="mt-1 break-all text-xs text-white/38">
                          {log.entityId}
                        </p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell className="max-w-md">
                      {log.metadataSummary ?? "-"}
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucun log"
              description="Les evenements sensibles seront listes ici."
            />
          )}
          <AdminPagination
            basePath="/admin/logs"
            searchParams={params}
            page={logsPage.page}
            perPage={logsPage.perPage}
            total={logsPage.total}
            totalPages={logsPage.totalPages}
          />
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}
