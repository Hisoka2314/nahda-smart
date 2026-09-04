// Interrogation du catalogue Icecat.
//
// Source unique pour l'import des visuels et celui des fiches techniques :
// les deux doivent apparier les produits exactement de la meme facon, sans
// quoi une fiche recoit les caracteristiques d'un appareil et la photo d'un
// autre.

// Tokens qui decrivent une caracteristique, jamais un modele.
const BRUIT = new Set([
  "SSD", "HDD", "NVME", "SATA", "USB", "HDMI", "VGA", "DVI", "RJ45", "BNC",
  "DDR2", "DDR3", "DDR4", "DDR5", "RAM", "GO", "GB", "TO", "TB", "MO", "MB",
  "CAT5", "CAT6", "POE", "WIFI", "LED", "LCD", "FHD", "UHD", "IPS", "OLED",
  "EME", "GHZ", "MHZ", "MAH", "MBPS", "CPU", "GPU", "UPS", "OTG", "MICROSD",
  "TYPE", "TYP", "PRO", "PLUS", "MAX", "MINI", "GAMING", "NOIR", "BLANC",
  "ORIGINAL", "NEW", "OEM", "2IN1", "3IN1", "COLORVU", "ETANCHE",
]);

export function referencesCandidates(nom) {
  const tokens =
    nom
      .toUpperCase()
      .replace(/["'”]/g, " ")
      .match(/[A-Z0-9][A-Z0-9./-]{2,}/g) ?? [];

  const vus = new Set();
  const sortie = [];

  for (const brut of tokens) {
    const t = brut.replace(/^[-./]+|[-./]+$/g, "");

    if (t.length < 3 || t.length > 24) continue;
    if (BRUIT.has(t)) continue;
    if (!/\d/.test(t)) continue;
    if (!/[A-Z]/.test(t) && t.length < 4) continue;
    // Mesures : "8GO", "15.6", "2.60", "90W".
    if (/^\d+(\.\d+)?(GO|GB|TO|TB|W|V|A|M|CM|MM|HZ|K|P|MP|U)?$/.test(t)) continue;
    if (/^I[3579]$/.test(t)) continue;
    if (vus.has(t)) continue;

    vus.add(t);
    sortie.push(t);
  }

  return sortie.slice(0, 4);
}

// Consommables compatibles : la designation porte la reference du modele
// d'origine ("Toner Podium CF217A HP") parce que c'est ce qu'elle remplace,
// pas ce qu'elle est. Icecat repondrait avec la fiche de la cartouche HP
// authentique pour une cartouche Podium.
const MARQUES_COMPATIBLES =
  /\b(PODIUM|STAR\s*INK|NEW\s*WORD|WORD|IMAX|COMPATIBLE|GENERIQUE|ADAPTABLE|REMANUFACTURE)\b/;

export function estConsommableCompatible(nom) {
  return MARQUES_COMPATIBLES.test(nom.toUpperCase());
}

function normaliser(texte) {
  return texte.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function interrogerIcecat(marque, reference, appKey) {
  const url = new URL("https://live.icecat.biz/api");
  url.searchParams.set("UserName", "openIcecat");
  url.searchParams.set("Language", "FR");
  url.searchParams.set("Brand", marque);
  url.searchParams.set("ProductCode", reference);
  if (appKey) url.searchParams.set("app_key", appKey);

  const reponse = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: { "user-agent": "nahda-smart-catalogue/1.0" },
  });

  const donnees = await reponse.json();

  if (donnees?.msg !== "OK" || !donnees?.data) {
    return { erreur: donnees?.Code ?? reponse.status };
  }

  return { fiche: donnees.data };
}

// L'API repond parfois sur une reference approchante. On n'accepte la fiche
// que si la marque et la reference cherchee se retrouvent dans le titre ou la
// reference constructeur renvoyee.
export function ficheCorrespond(fiche, marque, reference) {
  const info = fiche.GeneralInfo ?? {};
  const marqueRenvoyee = normaliser(info.Brand ?? "");

  if (marqueRenvoyee && marqueRenvoyee !== normaliser(marque)) return false;

  const cible = normaliser(reference);
  const champs = [info.BrandPartCode, info.ProductName, info.Title]
    .filter(Boolean)
    .map(normaliser);

  return champs.some((champ) => champ.includes(cible));
}

// Cherche la fiche d'un produit du magasin : essaie chaque reference plausible
// tiree de son nom, et rend la premiere qui corresponde vraiment.
export async function chercherFiche(produit, appKey) {
  if (estConsommableCompatible(produit.name)) return { motif: "compatible" };

  const candidats = referencesCandidates(produit.name);
  if (candidats.length === 0) return { motif: "sans-reference" };

  for (const reference of candidats) {
    let resultat;

    try {
      resultat = await interrogerIcecat(produit.marque, reference, appKey);
    } catch {
      return { motif: "reseau" };
    }

    if (resultat.erreur === 403) return { motif: "restreint" };

    if (resultat.fiche && ficheCorrespond(resultat.fiche, produit.marque, reference)) {
      return { fiche: resultat.fiche, reference };
    }
  }

  return { motif: "absent" };
}

// Met les caracteristiques a plat : un groupe, puis ses couples libelle/valeur.
export function caracteristiques(fiche) {
  const groupes = [];

  for (const groupe of fiche.FeaturesGroups ?? []) {
    const nom = groupe.FeatureGroup?.Name?.Value;
    const lignes = [];

    for (const trait of groupe.Features ?? []) {
      const libelle = trait.Feature?.Name?.Value;
      const valeur = trait.PresentationValue;

      if (!libelle || valeur === undefined || valeur === null || valeur === "") continue;
      lignes.push([String(libelle), String(valeur)]);
    }

    if (nom && lignes.length > 0) groupes.push({ groupe: String(nom), lignes });
  }

  return groupes;
}
