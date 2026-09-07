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

            {/* Mentions legales. Une facture marocaine qui ne les porte pas
                n'est pas opposable : le client ne peut pas la deduire, et
                l'administration peut la refuser. Toutes sont facultatives
                ici, pour que le magasin les saisisse a mesure qu'il recoit
                ses attestations -- un document omet la ligne vide plutot que
                d'imprimer un libelle sans valeur. */}
            <div className="lg:col-span-2 border-t border-white/10 pt-6">
              <p className="text-sm font-black uppercase tracking-wide text-nahda-olive">
                Mentions legales
              </p>
              <p className="mt-1 text-xs leading-5 text-white/60">
                Reprises en en-tete et en pied des factures et des devis. Une
                ligne laissee vide n&apos;est pas imprimee.
              </p>
            </div>

            <AdminField
              label="Raison sociale"
              hint="Telle qu'elle figure au registre du commerce."
            >
              <AdminTextInput
                name="legalName"
                defaultValue={settings.legalName}
                placeholder="Nahda Smart"
              />
            </AdminField>
            <AdminField label="Forme juridique">
              <AdminTextInput
                name="legalForm"
                defaultValue={settings.legalForm}
                placeholder="SARL AU"
              />
            </AdminField>
            <AdminField label="Capital social">
              <AdminTextInput
                name="legalCapital"
                defaultValue={settings.legalCapital}
                placeholder="100 000,00 DH"
              />
            </AdminField>
            <AdminField
              label="Siege social"
              hint="Adresse legale, si elle differe de l'adresse du magasin."
            >
              <AdminTextInput
                name="legalAddress"
                defaultValue={settings.legalAddress}
                placeholder="46 AV OKBA ET G 3, APT 18, Agdal, Rabat"
              />
            </AdminField>
            <AdminField label="ICE">
              <AdminTextInput
                name="ice"
                defaultValue={settings.ice}
                placeholder="003981799000019"
              />
            </AdminField>
            <AdminField label="Registre du commerce (RC)">
              <AdminTextInput
                name="rc"
                defaultValue={settings.rc}
                placeholder="132073"
              />
            </AdminField>
            <AdminField label="Tribunal du RC">
              <AdminTextInput
                name="rcCity"
                defaultValue={settings.rcCity}
                placeholder="Rabat"
              />
            </AdminField>
            <AdminField label="Identifiant fiscal (IF)">
              <AdminTextInput
                name="taxId"
                defaultValue={settings.taxId}
                placeholder="48553685"
              />
            </AdminField>
            <AdminField label="Patente">
              <AdminTextInput
                name="patente"
                defaultValue={settings.patente}
                placeholder="26900893"
              />
            </AdminField>
            <AdminField label="CNSS">
              <AdminTextInput
                name="cnss"
                defaultValue={settings.cnss}
                placeholder="2518767"
              />
            </AdminField>
            <AdminField
              label="Taux de TVA (%)"
              hint="Zero si le magasin n'est pas assujetti : la facture n'affiche alors aucun detail de taxe."
            >
              <AdminTextInput
                name="vatRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={String(settings.vatRate)}
                placeholder="20"
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
