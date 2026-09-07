"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, ScanLine, Search } from "lucide-react";

type ProduitSansCode = {
  id: string;
  sku: string;
  name: string;
  brandName: string;
  stock: number;
};

type Props = {
  produits: ProduitSansCode[];
  rattacher: (donnees: FormData) => Promise<
    { erreur?: string; ok?: boolean; nom?: string } | void
  >;
};

export function CodesBarresClient({ produits, rattacher }: Props) {
  const [restants, setRestants] = useState(produits);
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<string | null>(
    produits[0]?.id ?? null,
  );
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{
    texte: string;
    erreur: boolean;
  } | null>(null);
  const [enCours, demarrer] = useTransition();
  const champScan = useRef<HTMLInputElement>(null);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return restants;
    return restants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q),
    );
  }, [restants, recherche]);

  const produit = restants.find((p) => p.id === selection) ?? null;

  // Le champ de scan garde le focus : l'operateur tient l'article d'une main
  // et la douchette de l'autre, il ne doit pas avoir a cliquer entre deux.
  useEffect(() => {
    champScan.current?.focus();
  }, [selection]);

  function enregistrer() {
    if (!produit || !code.trim()) return;

    const donnees = new FormData();
    donnees.set("productId", produit.id);
    donnees.set("barcode", code.trim());

    demarrer(async () => {
      const resultat = await rattacher(donnees);

      if (resultat && "erreur" in resultat && resultat.erreur) {
        setMessage({ texte: resultat.erreur, erreur: true });
        return;
      }

      setMessage({ texte: `${produit.name} — code enregistre.`, erreur: false });
      setCode("");

      // L'article traite sort de la liste, et le suivant prend sa place :
      // l'operateur enchaine sans toucher a la souris.
      setRestants((precedents) => {
        const suivants = precedents.filter((p) => p.id !== produit.id);
        const index = precedents.findIndex((p) => p.id === produit.id);
        setSelection(suivants[index]?.id ?? suivants[0]?.id ?? null);
        return suivants;
      });
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Filtrer par nom, reference ou marque"
            className="h-10 w-full rounded-control border border-white/15 bg-[#071112] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-nahda-olive"
          />
        </div>

        <div className="max-h-[560px] overflow-y-auto rounded-card border border-white/10">
          {filtres.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-white/40">
              {restants.length === 0
                ? "Tous les articles ont leur code-barres."
                : "Aucun article ne correspond."}
            </p>
          ) : (
            filtres.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelection(p.id)}
                className={`flex w-full items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 text-left transition ${
                  p.id === selection
                    ? "bg-nahda-olive/20"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {p.name}
                  </p>
                  <p className="text-xs text-white/40">
                    {p.sku} · {p.brandName} · stock {p.stock}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-white/50">
            Article selectionne
          </p>
          {produit ? (
            <>
              <p className="mt-2 text-lg font-black leading-tight text-white">
                {produit.name}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {produit.sku} · {produit.brandName}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/40">
              Plus rien a traiter.
            </p>
          )}
        </div>

        {produit ? (
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-4">
            <label
              htmlFor="code"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-nahda-olive"
            >
              <ScanLine size={15} />
              Scanner l&apos;etiquette
            </label>
            <input
              id="code"
              ref={champScan}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                enregistrer();
              }}
              placeholder="Passez la douchette sur l'article"
              autoComplete="off"
              disabled={enCours}
              className="mt-2 h-14 w-full rounded-control border border-white/15 bg-[#071112] px-4 text-lg font-bold text-white outline-none placeholder:text-white/30 focus:border-nahda-olive disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-white/50">
              Le code s&apos;enregistre a la validation, et l&apos;article suivant
              prend la place.
            </p>
          </div>
        ) : null}

        {message ? (
          <div
            className={`flex items-start gap-2 rounded-card border px-4 py-3 text-sm font-bold ${
              message.erreur
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-nahda-olive/40 bg-nahda-olive/10 text-nahda-olive"
            }`}
          >
            {message.erreur ? null : <Check size={16} className="mt-0.5 shrink-0" />}
            <span>{message.texte}</span>
          </div>
        ) : null}

        <div className="rounded-card border border-white/10 bg-white/[0.03] p-4 text-sm">
          <p className="text-xs font-black uppercase text-white/50">Reste</p>
          <p className="mt-1 text-3xl font-black text-white">
            {restants.length}
          </p>
          <p className="text-xs text-white/40">article(s) sans code-barres</p>
        </div>
      </aside>
    </div>
  );
}
