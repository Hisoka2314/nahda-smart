// Fiches techniques deduites de la designation, pour les familles ou elle
// suffit.
//
// Utilisation :
//   node scripts/fiches-generiques.mjs [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Une barrette "RAM 8 GB DDR3 10600R PC BUREAU" porte deja tout ce qu'un
// client a besoin de savoir : la capacite, la generation, la frequence, le
// format et le type de memoire. Une pile "R03" est une AAA de 1,5 V. Un
// support "14-42 pouces" annonce sa plage. Ces fiches n'ont pas a etre
// cherchees une par une : elles se lisent.
//
// Le principe de scripts/enrich-product-descriptions.mjs s'applique ici
// aussi : ne rien inventer. Chaque ligne vient soit de la designation, soit
// d'un savoir sur le TYPE d'article -- une LR03 fait 1,5 V, une CR2032 fait
// 3 V -- verifiable et constant.
//
// Les fiches ecrites a la main dans completer-fiches-recherchees.mjs et
// celles importees d'Icecat sont prioritaires : ce script ne touche qu'aux
// produits qui n'ont aucun groupe "Caracteristiques".

import { readFileSync } from "node:fs";
import pg from "pg";

const apply = process.argv.slice(2).includes("--apply");

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// --- memoire vive ----------------------------------------------------------

// Le nombre qui suit la generation n'a pas le meme sens partout : en DDR2 et
// DDR3 c'est la bande passante du module (PC3-10600), en DDR4 c'est
// directement la frequence (DDR4-2400). Le magasin ecrit les deux de la meme
// facon, d'ou cette table.
const FREQUENCE_DDR = {
  2: { 4200: 533, 5300: 667, 6400: 800 },
  3: { 8500: 1066, 10600: 1333, 12800: 1600, 14900: 1866 },
};

// Lettre finale de la reference. En DDR2 et DDR3 elle dit le type de module ;
// en DDR4 c'est la lettre de classe JEDEC (2133P, 2400T, 2666V), qui ne
// renseigne pas sur le format.
const SUFFIXE_MODULE = {
  R: "registered ECC",
  U: "unbuffered",
  S: "SO-DIMM",
};

function ficheMemoire(nom) {
  const t = nom.toUpperCase();
  if (!/\bRAM\b/.test(t)) return null;

  const capacite = t.match(/(\d+)\s*G[OB]\b/)?.[1];
  const generation = t.match(/\bDDR\s*(\d)\b/)?.[1];
  if (!capacite || !generation) return null;

  const code = t.match(new RegExp(`DDR\\s*${generation}\\s*[- ]?(\\d{4,5})([A-Z]?)`));
  const valeur = code ? Number(code[1]) : null;
  const suffixe = code?.[2] ?? "";
  const portable = /\bPC\s*PORTABLE\b|\bSO-?DIMM\b/.test(t);
  const gen = Number(generation);

  const frequence =
    gen >= 4 ? valeur : (FREQUENCE_DDR[gen]?.[valeur] ?? null);

  const lignes = [
    ["Type", `Barrette de mémoire DDR${generation} pour ${portable ? "ordinateur portable" : "ordinateur de bureau"}`],
    ["Capacité", `${capacite} Go`],
  ];

  if (frequence) {
    const norme = gen >= 4 ? `DDR4-${valeur}` : `PC${gen}-${valeur}`;
    lignes.push(["Fréquence", `${frequence} MHz (${norme})`]);
  }

  // Le nombre de broches change avec la generation ET le format : une
  // SO-DIMM DDR2 en compte 200, une DDR3 204, une DDR4 260.
  const BROCHES = {
    2: { dimm: 240, sodimm: 200 },
    3: { dimm: 240, sodimm: 204 },
    4: { dimm: 288, sodimm: 260 },
    5: { dimm: 288, sodimm: 262 },
  };
  const broches = BROCHES[gen]?.[portable ? "sodimm" : "dimm"];
  lignes.push([
    "Format",
    broches ? `${portable ? "SO-DIMM" : "DIMM"}, ${broches} broches` : portable ? "SO-DIMM" : "DIMM",
  ]);

  // Une barrette registered ne demarre pas sur une carte mere de bureau : le
  // dire vaut mieux qu'un retour.
  if (gen < 4 && SUFFIXE_MODULE[suffixe] === "registered ECC") {
    lignes.push([
      "À vérifier avant l'achat",
      "Le suffixe R de la référence désigne une barrette « registered ECC », prévue pour les serveurs et les stations de travail. Elle ne démarre pas sur une carte mère de bureau ordinaire : faites confirmer la compatibilité en magasin.",
    ]);
  } else {
    lignes.push([
      "À vérifier avant l'achat",
      `La génération doit correspondre à la carte mère : une DDR${gen} n'entre pas dans un support d'une autre génération, le détrompeur n'est pas au même endroit.`,
    ]);
  }

  return lignes;
}

// --- piles -----------------------------------------------------------------

const PILES = [
  [/\bLR03\b|\bR03\b|\bAAA\b/, "AAA (LR03)", "1,5 V", "alcaline"],
  [/\bLR6\b|\bR6P?\b|\bAA\b/, "AA (LR6)", "1,5 V", "alcaline"],
  [/\bR20\b|\bLR20\b|\bD\/2\b/, "D (LR20)", "1,5 V", "alcaline"],
  [/\bR14\b|\bLR14\b/, "C (LR14)", "1,5 V", "alcaline"],
  [/\b(?:CR)?2016\b/, "CR2016, bouton", "3 V", "lithium"],
  [/\b(?:CR)?2025\b/, "CR2025, bouton", "3 V", "lithium"],
  [/\b(?:CR)?2032\b/, "CR2032, bouton", "3 V", "lithium"],
];

function fichePile(nom) {
  const t = nom.toUpperCase();
  if (!/\bPILE?S?\b/.test(t)) return null;

  for (const [motif, format, tension, chimie] of PILES) {
    if (!motif.test(t)) continue;

    const lignes = [
      ["Format", format],
      ["Tension", tension],
      ["Technologie", chimie === "lithium" ? "Lithium" : "Alcaline"],
    ];

    if (chimie === "lithium") {
      lignes.push([
        "Usage",
        "Carte mère, télécommande, balance, montre : les appareils qui consomment très peu pendant des années",
      ]);
    } else {
      lignes.push(["Vendu", "Par lot ou à l'unité selon le conditionnement"]);
    }

    return lignes;
  }

  return null;
}

// --- cables video ----------------------------------------------------------

function ficheCable(nom) {
  const t = nom.toUpperCase();
  const longueur = t.match(/(\d+(?:[.,]\d+)?)\s*M(?:ETRES?)?\b/)?.[1]?.replace(".", ",");

  if (/\bCABLE HDMI\b/.test(t)) {
    const definition = /\b8K\b/.test(t) ? "8K" : /\b4K\b/.test(t) ? "4K Ultra HD" : null;
    const lignes = [["Type", "Câble HDMI"]];
    if (longueur) lignes.push(["Longueur", `${longueur} mètres`]);
    if (definition) lignes.push(["Définition", definition]);
    lignes.push([
      "Transporte",
      "L'image et le son sur un seul câble, en numérique",
    ]);
    if (longueur && Number(longueur.replace(",", ".")) >= 10) {
      lignes.push([
        "À savoir",
        "Au-delà de dix mètres, la qualité du câble compte : un câble médiocre coupe l'image ou la fait scintiller.",
      ]);
    }
    return lignes.length >= 3 ? lignes : null;
  }

  if (/\bCABLE VGA\b/.test(t)) {
    const lignes = [["Type", "Câble VGA"]];
    if (longueur) lignes.push(["Longueur", `${longueur} mètres`]);
    lignes.push([
      "Transporte",
      "L'image seule, en analogique : le son passe par un câble séparé",
    ]);
    lignes.push([
      "Usage",
      "Écran, vidéoprojecteur ou unité centrale ancienne, dépourvus de HDMI",
    ]);
    return lignes;
  }

  return null;
}

// --- adaptateurs de connectique --------------------------------------------

const PORTS = [
  [/\bTYPE ?-?C\b|\bUSB ?-?C\b/, "USB-C"],
  [/\bMINI ?HDMI\b/, "mini HDMI"],
  [/\bHDMI\b|\bHDTV\b/, "HDMI"],
  [/\bVGA\b/, "VGA"],
  [/\bDVI\b/, "DVI"],
  [/\bDISPLAY ?PORT\b|\bDISPLAY\b|\bDP\b/, "DisplayPort"],
  [/\bRJ ?-?45\b/, "RJ45 (réseau)"],
  [/\bUSB\b/, "USB"],
];

function nommerPort(fragment) {
  for (const [motif, nom] of PORTS) {
    if (motif.test(fragment)) return nom;
  }
  return null;
}

function ficheAdaptateur(nom) {
  const t = nom.toUpperCase();
  if (!/\bADAPTATEUR\b|\bCONVERTISSEUR\b/.test(t)) return null;

  // Une carte d'acquisition "Type C to HDMI" fonctionne dans l'autre sens :
  // elle prend l'HDMI d'une source et l'envoie a l'ordinateur. La regle des
  // adaptateurs l'aurait decrite a l'envers.
  if (/\bCAPTURE\b|\bACQUISITION\b/.test(t)) {
    return [
      ["Type", "Carte d'acquisition vidéo"],
      ["Entrée", "HDMI, depuis une caméra, une console ou un second ordinateur"],
      ["Sortie", "USB-C vers l'ordinateur, qui voit la source comme une webcam"],
      ["Usage", "Diffusion en direct, enregistrement d'écran, visioconférence avec une vraie caméra"],
      ["À savoir", "Ce n'est pas un adaptateur : il ne permet pas d'afficher l'ordinateur sur un écran HDMI."],
    ];
  }

  const coupe = t.split(/\bTO\b|\bVERS\b|\b2\b/);
  if (coupe.length < 2) return null;

  const source = nommerPort(coupe[0]);
  const apres = coupe.slice(1).join(" ");

  // "Display TO VGA HDMI" sort sur les deux : les enumerer plutot que de
  // n'en garder qu'un.
  const sorties = PORTS.filter(([motif]) => motif.test(apres))
    .map(([, libelle]) => libelle)
    .filter((p) => p !== source);

  if (!source || sorties.length === 0) return null;

  // "mini HDMI" et "HDMI" repondent tous deux : ne garder que le plus precis.
  const destination = sorties
    .filter((p, i) => !sorties.some((autre, j) => j !== i && autre.endsWith(p)))
    .join(" ou ");

  const lignes = [
    ["Type", "Adaptateur de connectique"],
    ["Entrée", `${source}, côté source (ordinateur, console, lecteur)`],
    ["Sortie", `${destination}, côté écran ou périphérique`],
  ];

  if (/\bAUDIO\b/.test(t)) {
    lignes.push(["Audio", "Sortie son séparée, le VGA ne transportant que l'image"]);
  }

  lignes.push([
    "À vérifier avant l'achat",
    "Le sens de conversion : un adaptateur ne fonctionne pas dans les deux sens.",
  ]);

  return lignes;
}

// --- supports d'ecran ------------------------------------------------------

function ficheSupport(nom) {
  const t = nom.toUpperCase();
  if (!/\bSUPPORT\b/.test(t) || !/\bTV\b|\bLCD\b|\bECRAN\b/.test(t)) return null;

  const plage = t.match(/(\d+)\s*"?\s*[-_]\s*(\d+)\s*"/);
  const lignes = [["Type", "Support mural pour téléviseur ou écran"]];

  if (plage) lignes.push(["Diagonales admises", `${plage[1]} à ${plage[2]} pouces`]);

  lignes.push([
    "À vérifier avant l'achat",
    "La norme VESA de votre téléviseur, c'est-à-dire l'écartement des quatre trous à l'arrière, et son poids.",
  ]);
  lignes.push(["Fixation", "Murale, chevilles et visserie généralement fournies"]);

  return lignes.length >= 3 ? lignes : null;
}

// --- chargeurs et batteries externes ---------------------------------------

function ficheChargeur(nom) {
  const t = nom.toUpperCase();

  if (/\bPOWER ?BANK\b/.test(t)) {
    // Le magasin ecrit "10000MHZ" la ou il faut lire 10000 mAh.
    const capacite = t.match(/(\d{4,6})\s*(?:MAH|MHZ)\b/)?.[1];
    const puissance = t.match(/(\d+)\s*W\b/)?.[1];

    const lignes = [["Type", "Batterie externe"]];
    if (capacite) {
      lignes.push(["Capacité", `${Number(capacite).toLocaleString("fr-FR")} mAh`]);
    }
    if (puissance) lignes.push(["Puissance de charge", `${puissance} W`]);
    if (/\bMAGNETIC\b|\bMAGSAFE\b/.test(t)) {
      lignes.push(["Fixation", "Aimantée, pour les téléphones compatibles"]);
    }
    lignes.push([
      "Usage",
      "Recharge un téléphone ou une tablette en déplacement. La capacité en mAh donne le nombre de charges possibles.",
    ]);

    return lignes.length >= 3 ? lignes : null;
  }

  if (/\bCHARGEUR\b/.test(t) && /\bTEL\b|\bTELEPHONE\b|\bUSB\b|\bTYPE ?-?C\b/.test(t)) {
    const puissance = t.match(/(\d+)\s*W\b/)?.[1];
    const ampere = t.match(/(\d+(?:[.,]\d+)?)\s*A\b/)?.[1]?.replace(".", ",");

    const lignes = [["Type", "Chargeur secteur pour téléphone ou tablette"]];
    if (puissance) lignes.push(["Puissance", `${puissance} W`]);
    if (ampere) lignes.push(["Courant", `${ampere} A`]);
    if (/\b2\s*USB\b|\bDUAL\b/.test(t)) lignes.push(["Ports", "Deux sorties USB"]);
    if (/\bTYPE ?-?C\b/.test(t)) lignes.push(["Connecteur", "USB-C"]);

    lignes.push([
      "À vérifier avant l'achat",
      "La charge rapide n'est atteinte que si le téléphone et le câble la prennent en charge tous les deux.",
    ]);

    return lignes.length >= 3 ? lignes : null;
  }

  return null;
}

// --- stockage --------------------------------------------------------------

function ficheStockage(nom) {
  const t = nom.toUpperCase();

  if (/\bBOI?[IT]{1,2}IER\b.*\bDISQUE\b/.test(t)) {
    // Le guillemet des pouces manque sur une partie des designations.
    const format = t.match(/\b([23][.,]5)\s*"?/)?.[1]?.replace(".", ",");
    const usb = t.match(/USB\s*(\d(?:\.\d)?)/)?.[1];

    const lignes = [["Type", "Boîtier externe pour disque interne"]];
    if (format) lignes.push(["Format de disque", `${format} pouces`]);
    if (usb) lignes.push(["Interface", `USB ${usb}`]);
    if (/\bTYPE ?-?C\b/.test(t)) lignes.push(["Connecteur", "USB-C"]);
    lignes.push([
      "Usage",
      "Transforme un disque récupéré en disque externe. Aucune alimentation séparée en 2,5 pouces : le port USB suffit.",
    ]);

    return lignes.length >= 3 ? lignes : null;
  }

  if (/\bCLE USB\b/.test(t)) {
    const capacite = t.match(/(\d+)\s*G[OB]\b/)?.[1];
    if (!capacite) return null;

    const lignes = [
      ["Type", "Clé USB"],
      ["Capacité", `${capacite} Go`],
    ];
    if (/\b3\.\d\b|\bUSB ?3\b/.test(t)) {
      lignes.push(["Interface", "USB 3.0, rétrocompatible USB 2.0"]);
    }
    lignes.push(["Compatibilité", "Windows, macOS et Linux, sans pilote à installer"]);

    return lignes;
  }

  if (/\bCARTE MEMOIRE\b|\bMICRO ?SD\b/.test(t)) {
    const capacite = t.match(/(\d+)\s*G[OB]\b/)?.[1];
    if (!capacite) return null;

    return [
      ["Type", "Carte mémoire microSD"],
      ["Capacité", `${capacite} Go`],
      ["Usage", "Téléphone, tablette, caméra de surveillance ou appareil photo"],
      [
        "À vérifier avant l'achat",
        "La classe de vitesse exigée par votre appareil : une caméra qui enregistre en continu demande une carte prévue pour cela.",
      ],
    ];
  }

  if (/\bDISQUE DUR\b/.test(t) && !/\bSSD\b/.test(t)) {
    const capacite = t.match(/(\d+)\s*G[OB]\b/)?.[1];
    const to = t.match(/(\d+)\s*T[OB]\b/)?.[1];
    const format = t.match(/(\d[.,]\d)\s*"/)?.[1]?.replace(".", ",");
    if (!capacite && !to) return null;

    const lignes = [
      ["Type", "Disque dur mécanique interne"],
      ["Capacité", to ? `${to} To` : `${capacite} Go`],
    ];

    if (format) {
      lignes.push([
        "Format",
        format === "2,5"
          ? "2,5 pouces, celui des ordinateurs portables"
          : "3,5 pouces, celui des ordinateurs de bureau et des enregistreurs",
      ]);
    }

    lignes.push(["Interface", "SATA"]);
    return lignes;
  }

  return null;
}

// --- batteries d'ordinateur portable ---------------------------------------

function ficheBatterie(nom) {
  const t = nom.toUpperCase();
  if (!/\bBATTERIE\b/.test(t) || !/\bPC PORTABLE\b|\bLAPTOP\b/.test(t)) return null;

  // Tout ce qui suit "PC PORTABLE" designe les machines compatibles. Les
  // mentions de stock du magasin ("Origine", "New") s'y accrochent en fin de
  // chaine : elles ne sont pas des modeles.
  const modeles = nom
    .replace(/^.*?PC Portable\s*/i, "")
    .replace(/\s+(?:Origine|New|Neuve?|Neuf|S)\s*$/i, "")
    .trim();
  if (!modeles) return null;

  return [
    ["Type", "Batterie de remplacement pour ordinateur portable"],
    ["Modèles compatibles", modeles],
    [
      "À vérifier avant l'achat",
      "La référence inscrite sur la batterie d'origine : deux machines du même modèle peuvent porter des batteries différentes.",
    ],
    [
      "À savoir",
      "Une batterie neuve retrouve son autonomie d'origine, mais pas au-delà : elle ne rend pas la machine plus rapide.",
    ],
  ];
}

const REGLES = [
  ficheMemoire,
  fichePile,
  ficheCable,
  ficheAdaptateur,
  ficheSupport,
  ficheChargeur,
  ficheStockage,
  ficheBatterie,
];

// --- application -----------------------------------------------------------

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const { rows: produits } = await client.query(`
    SELECT p.id, p.sku, p.name, p."technicalDescription",
           COALESCE(SUM(s.quantity), 0)::int AS stock
      FROM "Product" p
      LEFT JOIN "Stock" s ON s."productId" = p.id
     WHERE p.status <> 'ARCHIVED'
     GROUP BY p.id
     ORDER BY p.name`);

  const stats = { examines: 0, ecrites: 0, deja: 0, sansRegle: 0 };
  const ecrites = [];

  if (apply) await client.query("BEGIN");

  for (const produit of produits) {
    if (produit.stock <= 0) continue;
    stats.examines += 1;

    let groupes = [];
    try {
      const existant = JSON.parse(produit.technicalDescription ?? "[]");
      if (Array.isArray(existant)) groupes = existant;
    } catch {
      groupes = [];
    }

    // Une fiche redigee a la main ou importee d'Icecat vaut mieux qu'une
    // fiche deduite : on ne la remplace pas.
    if (groupes.some((g) => g?.groupe === "Caractéristiques")) {
      stats.deja += 1;
      continue;
    }

    let lignes = null;
    for (const regle of REGLES) {
      lignes = regle(produit.name);
      if (lignes) break;
    }

    if (!lignes || lignes.length < 3) {
      stats.sansRegle += 1;
      continue;
    }

    stats.ecrites += 1;
    ecrites.push({ sku: produit.sku, nom: produit.name, lignes });

    if (apply) {
      groupes.unshift({ groupe: "Caractéristiques", lignes });
      await client.query(
        `UPDATE "Product" SET "technicalDescription" = $2, "updatedAt" = NOW() WHERE id = $1`,
        [produit.id, JSON.stringify(groupes)],
      );
    }
  }

  if (apply) await client.query("COMMIT");

  console.log(apply ? "=== FICHES ECRITES ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
  console.log(`Produits en stock       : ${stats.examines}`);
  console.log(`Fiches deduites         : ${stats.ecrites}`);
  console.log(`Deja documentes         : ${stats.deja}`);
  console.log(`Sans regle applicable   : ${stats.sansRegle}`);
  console.log();

  ecrites.forEach((f) => {
    console.log(`--- ${f.sku.padEnd(18)} ${f.nom.slice(0, 52)}`);
    f.lignes.forEach(([label, valeur]) =>
      console.log(`      ${label.padEnd(24)} ${valeur.slice(0, 88)}`),
    );
  });
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
