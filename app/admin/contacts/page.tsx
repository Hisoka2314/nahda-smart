import Link from "next/link";
import { ContactMessageStatus } from "@prisma/client";
import { PhoneMissed, PhoneOutgoing, UserPlus } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminPageHeader,
  AdminPanel,
  AdminSearchBox,
  AdminSelect,
  AdminStatusBadge,
  AdminTable,
  AdminTableCell,
  AdminTableHead,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  leadCallbackAction,
  leadConvertAction,
  leadNoAnswerAction,
  leadNoteAction,
  updateContactStatusAction,
} from "@/app/admin/contacts/actions";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import {
  contactStatusLabels,
  getContactStatusTone,
} from "@/lib/admin/labels";
import { getAdminContacts } from "@/lib/services/admin-contacts";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("contacts");
  const params = await searchParams;
  const filters = {
    q: getSingle(params.q),
    status: getContactStatus(params.status),
  };
  const contacts = await getAdminContacts(filters);

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Relation client"
          title="Leads & contacts"
          description="Traitez chaque demande comme un lead : appelez, notez, planifiez un rappel, puis convertissez en client."
        />
        <AdminFeedback
          success={getSingle(params.success)}
          error={getSingle(params.error)}
        />

        <AdminPanel title="Filtres">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <AdminSearchBox
              placeholder="Nom, telephone, email, sujet..."
              defaultValue={filters.q}
            />
            <AdminSelect name="status" defaultValue={filters.status}>
              <option value="">Tous statuts</option>
              {Object.values(ContactMessageStatus).map((status) => (
                <option key={status} value={status}>
                  {contactStatusLabels[status]}
                </option>
              ))}
            </AdminSelect>
            <Button type="submit" variant="lightOutline" size="sm">
              Filtrer
            </Button>
          </form>
        </AdminPanel>

        <AdminPanel title={`${contacts.length} leads`}>
          {contacts.length ? (
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Message & note</th>
                  <th className="px-3 py-3">Suivi</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </AdminTableHead>
              <tbody className="divide-y divide-white/10">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <AdminTableCell className="min-w-[130px] text-xs">
                      {contact.createdAt}
                    </AdminTableCell>
                    <AdminTableCell className="min-w-[160px]">
                      <p className="font-bold text-white">{contact.name}</p>
                      <a
                        href={`tel:${contact.phone}`}
                        className="mt-1 block text-xs font-bold text-nahda-olive hover:underline"
                      >
                        {contact.phone}
                      </a>
                      {contact.email ? (
                        <p className="mt-1 text-xs text-white/38">
                          {contact.email}
                        </p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell className="max-w-sm">
                      <p className="text-xs font-black uppercase text-white/44">
                        {contact.subject}
                      </p>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-sm font-semibold text-white/72">
                          {contact.shortMessage}
                        </summary>
                        <p className="mt-3 whitespace-pre-wrap rounded-control border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/62">
                          {contact.message}
                        </p>
                        <form action={leadNoteAction} className="mt-3 grid gap-2">
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="returnTo" value="/admin/contacts" />
                          <textarea
                            name="note"
                            defaultValue={contact.internalNote}
                            placeholder="Note interne (resume d'appel, contexte...)"
                            rows={2}
                            className="w-full rounded-control border border-white/10 bg-white/[0.055] p-2.5 text-xs font-semibold text-white outline-none placeholder:text-white/34 focus:border-nahda-olive/70"
                          />
                          <Button type="submit" variant="lightOutline" size="sm" className="justify-self-start">
                            Enregistrer la note
                          </Button>
                        </form>
                      </details>
                      {contact.internalNote ? (
                        <p className="mt-2 rounded-control bg-nahda-olive/[0.12] px-2.5 py-1.5 text-xs font-semibold leading-5 text-[#c8dd8f]">
                          {contact.internalNote}
                        </p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell className="min-w-[150px] text-xs">
                      <p>
                        Tentatives :{" "}
                        <span className="font-black text-white">
                          {contact.callAttempts}
                        </span>
                      </p>
                      {contact.callbackAt ? (
                        <p className="mt-1 text-[#e8b45a]">
                          Rappel : {contact.callbackAt}
                        </p>
                      ) : null}
                      {contact.lastContactAt ? (
                        <p className="mt-1 text-white/44">
                          Dernier contact : {contact.lastContactAt}
                        </p>
                      ) : null}
                    </AdminTableCell>
                    <AdminTableCell>
                      <AdminStatusBadge tone={getContactStatusTone(contact.status)}>
                        {contact.statusLabel}
                      </AdminStatusBadge>
                    </AdminTableCell>
                    <AdminTableCell className="min-w-[250px]">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <form action={leadNoAnswerAction}>
                            <input type="hidden" name="contactId" value={contact.id} />
                            <input type="hidden" name="returnTo" value="/admin/contacts" />
                            <Button type="submit" variant="lightOutline" size="sm" title="Appel sans reponse : +1 tentative">
                              <PhoneMissed size={14} />
                              Pas de rep.
                            </Button>
                          </form>
                          {contact.customerId ? (
                            <Link
                              href={`/admin/clients/${contact.customerId}`}
                              className="inline-flex h-9 items-center gap-1 rounded-control bg-nahda-olive px-3 text-xs font-bold text-white hover:bg-nahda-olive-dark"
                            >
                              <UserPlus size={14} />
                              Voir client
                            </Link>
                          ) : (
                            <form action={leadConvertAction}>
                              <input type="hidden" name="contactId" value={contact.id} />
                              <input type="hidden" name="returnTo" value="/admin/contacts" />
                              <Button type="submit" size="sm" title="Creer la fiche client et ouvrir">
                                <UserPlus size={14} />
                                Convertir
                              </Button>
                            </form>
                          )}
                        </div>
                        <form action={leadCallbackAction} className="flex items-center gap-1.5 whitespace-nowrap">
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="returnTo" value="/admin/contacts" />
                          <input
                            type="datetime-local"
                            name="callbackAt"
                            required
                            className="h-9 rounded-control border border-white/10 bg-[#0c1718] px-2 text-xs font-bold text-white outline-none [color-scheme:dark]"
                          />
                          <Button type="submit" variant="lightOutline" size="sm" title="Planifier un rappel">
                            <PhoneOutgoing size={14} />
                            Rappeler
                          </Button>
                        </form>
                        <form action={updateContactStatusAction} className="flex items-center gap-1.5 whitespace-nowrap">
                          <input type="hidden" name="contactId" value={contact.id} />
                          <input type="hidden" name="returnTo" value="/admin/contacts" />
                          <select
                            name="status"
                            defaultValue={contact.status}
                            className="h-9 rounded-control border border-white/10 bg-[#0c1718] px-2 text-xs font-bold text-white outline-none"
                          >
                            {Object.values(ContactMessageStatus).map((status) => (
                              <option key={status} value={status}>
                                {contactStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" variant="ghost" size="sm" className="text-white/70 hover:bg-white/[0.08] hover:text-white">
                            OK
                          </Button>
                        </form>
                      </div>
                    </AdminTableCell>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <AdminEmptyState
              title="Aucun lead trouve"
              description="Les messages du formulaire contact arrivent ici en tant que leads a traiter."
            />
          )}
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getContactStatus(value: string | string[] | undefined) {
  const single = getSingle(value);
  return single &&
    Object.values(ContactMessageStatus).includes(single as ContactMessageStatus)
    ? (single as ContactMessageStatus)
    : undefined;
}
