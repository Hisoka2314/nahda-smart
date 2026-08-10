import { AdminLayout } from "@/components/admin/admin-layout";
import {
  AdminFeedback,
  AdminField,
  AdminPageHeader,
  AdminPanel,
  AdminTextInput,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { requireAdminSection } from "@/lib/auth/admin-auth";
import { getSiteSettingsForAdmin } from "@/lib/services/admin-site-settings";
import { getSingleQuery } from "@/lib/admin/pagination";
import { updateSiteSettingsAction } from "@/app/admin/parametres/actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdminSection("settings");
  const params = await searchParams;
  const settings = await getSiteSettingsForAdmin();

  return (
    <AdminLayout admin={admin}>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Configuration"
          title="Paramètres du site"
          description="Coordonnées affichées sur le site public (pied de page, contact, WhatsApp). Les modifications sont visibles immédiatement."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Paramètres" },
          ]}
        />
        <AdminFeedback
          success={getSingleQuery(params.success)}
          error={getSingleQuery(params.error)}
        />

        <AdminPanel title="Coordonnées de contact">
          <form
            action={updateSiteSettingsAction}
            className="grid gap-4 lg:grid-cols-2"
          >
            <AdminField label="Nom de la société">
              <AdminTextInput
                name="companyName"
                defaultValue={settings.companyName}
                required
              />
            </AdminField>
            <AdminField label="E-mail de contact">
              <AdminTextInput
                name="email"
                type="email"
                defaultValue={settings.email}
                placeholder="contact@nahdasmart.ma"
                required
              />
            </AdminField>
            <AdminField label="Téléphone">
              <AdminTextInput
                name="phone"
                defaultValue={settings.phone}
                placeholder="0800 123 456"
                required
              />
            </AdminField>
            <AdminField
              label="Numéro WhatsApp"
              hint="Format international, ex. 212600000000"
            >
              <AdminTextInput
                name="whatsapp"
                defaultValue={settings.whatsapp}
                placeholder="212600000000"
                required
              />
            </AdminField>
            <AdminField label="Adresse du magasin">
              <AdminTextInput
                name="addressPrimary"
                defaultValue={settings.addressPrimary}
                placeholder="Casablanca, Maarif"
                required
              />
            </AdminField>
            <AdminField
              label="Adresse secondaire (optionnelle)"
              hint="Laissez vide si vous n'avez qu'un seul local."
            >
              <AdminTextInput
                name="addressSecondary"
                defaultValue={settings.addressSecondary}
                placeholder="Rabat, Agdal"
              />
            </AdminField>
            <AdminField
              label="Lien Google Maps"
              hint="Lien de partage Maps du magasin. Vide = recherche automatique sur l'adresse."
            >
              <AdminTextInput
                name="mapsUrl"
                defaultValue={settings.mapsUrl}
                placeholder="https://maps.app.goo.gl/..."
              />
            </AdminField>
            <AdminField label="Page Facebook" hint="URL complète, vide = icône masquée.">
              <AdminTextInput
                name="facebookUrl"
                defaultValue={settings.facebookUrl}
                placeholder="https://www.facebook.com/nahdasmart"
              />
            </AdminField>
            <AdminField label="Compte Instagram" hint="URL complète, vide = icône masquée.">
              <AdminTextInput
                name="instagramUrl"
                defaultValue={settings.instagramUrl}
                placeholder="https://www.instagram.com/nahdasmart"
              />
            </AdminField>
            <AdminField
              label="Horaires d'ouverture"
              hint="Affichés sur les pages Contact et Magasins."
            >
              <AdminTextInput
                name="openingHours"
                defaultValue={settings.openingHours}
                placeholder="Lun - Sam : 9h00 - 18h00"
                required
              />
            </AdminField>
            <AdminField
              label="Frais de livraison à domicile (DH)"
              hint="Appliqués au panier et à toute nouvelle commande. Le retrait en magasin reste gratuit."
            >
              <AdminTextInput
                name="deliveryFee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={String(settings.deliveryFee)}
                placeholder="30"
                required
              />
            </AdminField>

            <div className="lg:col-span-2">
              <Button type="submit">Enregistrer les modifications</Button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminLayout>
  );
}
