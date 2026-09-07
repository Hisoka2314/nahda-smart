"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Minus, Plus, ScanLine, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArticleCaisse } from "@/lib/services/admin-caisse";

type LigneTicket = {
  article: ArticleCaisse;
  quantite: number;
};

type CaisseClientProps = {
  articles: ArticleCaisse[];
  depots: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; label: string }>;
  clientComptoirId: string;
  encaisser: (donnees: FormData) => Promise<{ erreur?: string } | void>;
};

function dirhams(montant: number): string {
  return `${montant.toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DH`;
}

export function CaisseClient({
  articles,
  depots,
  clients,
  clientComptoirId,
  encaisser,
}: CaisseClientProps) {
  const [lignes, setLignes] = useState<LigneTicket[]>([]);
  const [saisie, setSaisie] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [depotId, setDepotId] = useState(depots[0]?.id ?? "");
  const [clientId, setClientId] = useState(clientComptoirId);
  const [paiement, setPaiement] = useState("PAY_ON_SITE");
  const [enCours, demarrer] = useTransition();
  const champScan = useRef<HTMLInputElement>(null);

  // Index de recherche construit une fois. La douchette tape le code puis
  // envoie Entree : la reponse doit etre immediate, donc tout se resout en
  // memoire plutot que par un aller-retour reseau.
  const index = useMemo(() => {
    const parCode = new Map<string, ArticleCaisse>();
    for (const article of articles) {
      if (article.barcode) parCode.set(article.barcode.toUpperCase(), article);
      parCode.set(article.sku.toUpperCase(), article);
    }
    return parCode;
  }, [articles]);

  // Le champ de scan reprend le focus des qu'il le perd. Sans cela, un clic
  // sur le ticket enverrait le scan suivant dans le vide -- une douchette
  // tape ou se trouve le curseur, elle ne choisit pas sa destination.
  useEffect(() => {
    const rendreLeFocus = () => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (document.activeElement?.tagName === "SELECT") return;
      champScan.current?.focus();
    };

    const minuterie = window.setInterval(rendreLeFocus, 400);
    champScan.current?.focus();
    return () => window.clearInterval(minuterie);
  }, []);

  function ajouter(code: string) {
    const propre = code.trim().toUpperCase();
    if (!propre) return;

    const article = index.get(propre);

    if (!article) {
      setMessage(`Code inconnu : ${propre}`);
      return;
    }

    setLignes((precedentes) => {
      const existante = precedentes.find((l) => l.article.id === article.id);
      if (existante) {
        return precedentes.map((l) =>
          l.article.id === article.id ? { ...l, quantite: l.quantite + 1 } : l,
        );
      }
      return [...precedentes, { article, quantite: 1 }];
    });

    setMessage(null);
  }

  function changerQuantite(id: string, delta: number) {
    setLignes((precedentes) =>
      precedentes
        .map((l) =>
          l.article.id === id ? { ...l, quantite: l.quantite + delta } : l,
        )
        .filter((l) => l.quantite > 0),
    );
  }

  function retirer(id: string) {
    setLignes((precedentes) => precedentes.filter((l) => l.article.id !== id));
  }

  const total = lignes.reduce(
    (somme, ligne) => somme + ligne.article.price * ligne.quantite,
    0,
  );

  // Un article non vendable est soit encore en brouillon, soit sans prix : la
  // commande partirait a zero dirham, ou serait refusee par le serveur. Le
  // dire ici evite au vendeur de le decouvrir a l'encaissement.
  const sansPrix = lignes.filter((l) => !l.article.vendable);
  const stockInsuffisant = lignes.filter(
    (l) => l.quantite > l.article.stock,
  );

  function valider() {
    if (lignes.length === 0) return;

    const donnees = new FormData();
    donnees.set("depotId", depotId);
    donnees.set("customerId", clientId);
    donnees.set("paymentMethod", paiement);
    donnees.set(
      "items",
      JSON.stringify(
        lignes.map((l) => ({
          productId: l.article.id,
          quantity: l.quantite,
        })),
      ),
    );

    demarrer(async () => {
      const resultat = await encaisser(donnees);
      if (resultat && "erreur" in resultat && resultat.erreur) {
        setMessage(resultat.erreur);
        return;
      }
      setLignes([]);
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-4">
          <label
            htmlFor="scan"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-nahda-olive"
          >
            <ScanLine size={15} />
            Scanner un article
          </label>
          <input
            id="scan"
            ref={champScan}
            value={saisie}
            onChange={(event) => setSaisie(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              ajouter(saisie);
              setSaisie("");
            }}
            placeholder="Passez la douchette, ou tapez un code puis Entrée"
            autoComplete="off"
            className="mt-2 h-14 w-full rounded-control border border-white/15 bg-[#071112] px-4 text-lg font-bold text-white outline-none placeholder:text-white/30 focus:border-nahda-olive"
          />
          <p className="mt-2 text-xs text-white/50">
            Le curseur revient ici tout seul : scannez sans cliquer.
          </p>
        </div>

        {message ? (
          <div className="flex items-center justify-between gap-3 rounded-card border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-card border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-left text-xs font-black uppercase text-white/50">
                <th className="px-4 py-3">Article</th>
                <th className="px-3 py-3 text-center">Qté</th>
                <th className="px-3 py-3 text-right">P.U.</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-white/40">
                    Ticket vide. Scannez un premier article.
                  </td>
                </tr>
              ) : (
                lignes.map((ligne) => (
                  <tr key={ligne.article.id} className="border-b border-white/[0.06]">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">{ligne.article.name}</p>
                      <p className="text-xs text-white/40">
                        {ligne.article.sku}
                        {ligne.article.barcode ? ` · ${ligne.article.barcode}` : ""}
                        {ligne.quantite > ligne.article.stock
                          ? ` · stock ${ligne.article.stock}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => changerQuantite(ligne.article.id, -1)}
                          className="grid h-7 w-7 place-items-center rounded-[6px] border border-white/15 text-white/70 hover:bg-white/10"
                          aria-label="Retirer un"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center font-black text-white">
                          {ligne.quantite}
                        </span>
                        <button
                          type="button"
                          onClick={() => changerQuantite(ligne.article.id, 1)}
                          className="grid h-7 w-7 place-items-center rounded-[6px] border border-white/15 text-white/70 hover:bg-white/10"
                          aria-label="Ajouter un"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-white/70">
                      {ligne.article.priceLabel}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-white">
                      {dirhams(ligne.article.price * ligne.quantite)}
                    </td>
                    <td className="pr-3">
                      <button
                        type="button"
                        onClick={() => retirer(ligne.article.id)}
                        className="grid h-7 w-7 place-items-center rounded-[6px] text-white/40 hover:bg-red-500/15 hover:text-red-300"
                        aria-label="Retirer la ligne"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-white/50">
            Total à encaisser
          </p>
          <p className="mt-1 text-4xl font-black text-nahda-olive">
            {dirhams(total)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {lignes.reduce((n, l) => n + l.quantite, 0)} article(s)
          </p>
        </div>

        <div className="space-y-3 rounded-card border border-white/10 bg-white/[0.03] p-4">
          <div>
            <label
              htmlFor="client"
              className="text-xs font-black uppercase text-white/50"
            >
              Client
            </label>
            <select
              id="client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="mt-1 h-10 w-full rounded-control border border-white/15 bg-[#071112] px-3 text-sm text-white outline-none focus:border-nahda-olive"
            >
              <option value={clientComptoirId}>Vente au comptoir</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="paiement"
              className="text-xs font-black uppercase text-white/50"
            >
              Paiement
            </label>
            <select
              id="paiement"
              value={paiement}
              onChange={(event) => setPaiement(event.target.value)}
              className="mt-1 h-10 w-full rounded-control border border-white/15 bg-[#071112] px-3 text-sm text-white outline-none focus:border-nahda-olive"
            >
              <option value="PAY_ON_SITE">Espèces au comptoir</option>
              <option value="CASH_ON_DELIVERY">À la livraison</option>
            </select>
          </div>

          {depots.length > 1 ? (
            <div>
              <label
                htmlFor="depot"
                className="text-xs font-black uppercase text-white/50"
              >
                Dépôt
              </label>
              <select
                id="depot"
                value={depotId}
                onChange={(event) => setDepotId(event.target.value)}
                className="mt-1 h-10 w-full rounded-control border border-white/15 bg-[#071112] px-3 text-sm text-white outline-none focus:border-nahda-olive"
              >
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {sansPrix.length > 0 ? (
          <div className="rounded-card border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
            <p className="font-black">Article pas encore en vente</p>
            <p className="mt-1">
              {sansPrix.map((l) => l.article.name).join(", ")} — brouillon ou prix
              non saisi. Renseignez le prix et publiez la fiche avant
              d&apos;encaisser.
            </p>
          </div>
        ) : null}

        {stockInsuffisant.length > 0 ? (
          <div className="rounded-card border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
            <p className="font-black">Stock insuffisant</p>
            <p className="mt-1">
              {stockInsuffisant
                .map((l) => `${l.article.name} (${l.article.stock} en stock)`)
                .join(", ")}
            </p>
          </div>
        ) : null}

        <Button
          type="button"
          className="h-14 w-full text-base"
          disabled={
            lignes.length === 0 ||
            enCours ||
            sansPrix.length > 0 ||
            stockInsuffisant.length > 0
          }
          onClick={valider}
        >
          {enCours ? "Encaissement…" : `Encaisser ${dirhams(total)}`}
        </Button>

        {lignes.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setLignes([]);
              setMessage(null);
            }}
            className="w-full text-center text-xs font-bold text-white/40 hover:text-red-300"
          >
            Vider le ticket
          </button>
        ) : null}
      </aside>
    </div>
  );
}
