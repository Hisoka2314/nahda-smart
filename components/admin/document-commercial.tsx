import Image from "next/image";
import type { SiteSettings } from "@/lib/settings";

// En-tete et pied de page communs a la facture et au devis.
//
// Les deux documents portaient jusqu'ici leur propre mise en page, et le devis
// n'etait meme pas imprimable. Les partager evite qu'ils divergent : une
// mention legale ajoutee ici apparait sur les deux.

type EnteteProps = {
  settings: SiteSettings;
  titre: string;
  numero: string;
  date: string;
  mentionSecondaire?: string;
};

// Une ligne d'identifiant n'est rendue que si le magasin l'a renseignee. Le
// RC, l'IF, la patente et le CNSS ne sont pas encore saisis : imprimer
// "IF :" suivi d'un blanc ferait plus desordre qu'utile.
function LigneIdentifiants({ settings }: { settings: SiteSettings }) {
  const identifiants = [
    settings.ice && `ICE : ${settings.ice}`,
    settings.rc && `RC ${settings.rcCity} : ${settings.rc}`,
    settings.taxId && `IF : ${settings.taxId}`,
    settings.patente && `Patente : ${settings.patente}`,
    settings.cnss && `CNSS : ${settings.cnss}`,
  ].filter(Boolean);

  if (identifiants.length === 0) return null;

  return (
    <p className="mt-1 text-[11px] leading-5 text-neutral-500">
      {identifiants.join("  ·  ")}
    </p>
  );
}

export function EnteteDocument({
  settings,
  titre,
  numero,
  date,
  mentionSecondaire,
}: EnteteProps) {
  const raison = settings.legalName || settings.companyName;

  return (
    <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-nahda-ink pb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-nahda-smart-mark.png"
            alt={raison}
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight">{raison}</h1>
            {settings.legalForm ? (
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                {settings.legalForm}
                {settings.legalCapital ? ` · Capital ${settings.legalCapital}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {settings.legalAddress || settings.addressPrimary}
          <br />
          Tél : {settings.phone}
          {settings.email ? (
            <>
              <br />
              {settings.email}
            </>
          ) : null}
        </p>

        <LigneIdentifiants settings={settings} />
      </div>

      <div className="text-right">
        <p className="text-xl font-black uppercase">{titre}</p>
        <p className="mt-2 text-sm font-bold text-neutral-600">N° {numero}</p>
        <p className="text-sm text-neutral-500">{date}</p>
        {mentionSecondaire ? (
          <p className="mt-1 text-sm text-neutral-500">{mentionSecondaire}</p>
        ) : null}
      </div>
    </header>
  );
}

export function PiedDocument({ settings }: { settings: SiteSettings }) {
  const raison = settings.legalName || settings.companyName;
  const identifiants = [
    settings.legalForm,
    settings.legalCapital && `Capital ${settings.legalCapital}`,
    settings.ice && `ICE ${settings.ice}`,
    settings.rc && `RC ${settings.rcCity} ${settings.rc}`,
    settings.taxId && `IF ${settings.taxId}`,
    settings.patente && `Patente ${settings.patente}`,
    settings.cnss && `CNSS ${settings.cnss}`,
  ].filter(Boolean);

  return (
    <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-[11px] leading-5 text-neutral-500">
      <p className="font-bold text-neutral-600">
        {raison} — {settings.legalAddress || settings.addressPrimary}
      </p>
      <p>
        Tél : {settings.phone}
        {settings.email ? ` — ${settings.email}` : ""}
      </p>
      {identifiants.length > 0 ? <p>{identifiants.join(" — ")}</p> : null}
    </footer>
  );
}

// Recapitulatif hors taxe / TVA / toutes taxes.
//
// Les montants du catalogue sont saisis toutes taxes comprises, comme le
// magasin les affiche en boutique. La facture doit malgre tout detailler la
// base et la taxe : c'est ce que l'administration attend, et sans quoi le
// client professionnel ne peut rien deduire. On remonte donc du TTC vers le
// HT plutot que l'inverse.
export function totauxAvecTva(totalTtc: number, tauxPourcent: number) {
  if (tauxPourcent <= 0) {
    return { ht: totalTtc, tva: 0, ttc: totalTtc, taux: 0 };
  }

  const ht = totalTtc / (1 + tauxPourcent / 100);
  return {
    ht,
    tva: totalTtc - ht,
    ttc: totalTtc,
    taux: tauxPourcent,
  };
}

export function dirhams(montant: number): string {
  return `${montant.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DH`;
}
