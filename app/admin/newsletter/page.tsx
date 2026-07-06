import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getNewsletterSubscribers } from "@/lib/services/newsletter";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const admin = await requireAdminSection("contacts");
  const subscribers = await getNewsletterSubscribers();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Relation client"
          title="Abonnés newsletter"
          description="Adresses collectées via le formulaire d'inscription du site. Exportez-les vers votre outil d'emailing."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Newsletter" },
          ]}
        />

        <AdminPanel title={`${subscribers.length} abonné(s)`}>
          {subscribers.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">E-mail</th>
                  <th className="px-3 py-3">Inscrit le</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <AdminTableCell className="font-bold text-white">
                      {subscriber.email}
                    </AdminTableCell>
                    <AdminTableCell>{subscriber.createdAt}</AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucun abonné pour le moment"
              description="Les inscriptions du formulaire newsletter du site apparaîtront ici."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}
