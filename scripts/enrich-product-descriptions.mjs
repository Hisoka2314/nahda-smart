// Redaction des fiches produit importees depuis l'inventaire.
//
// Utilisation :
//   node scripts/enrich-product-descriptions.mjs [--apply] [--tout]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// L'import d'inventaire recopie la designation brute du magasin dans la
// description : "GLASS TEL SAMSUNG NOTE 4". C'est illisible en boutique et
// sans valeur pour le referencement. Ce script en tire une fiche presentable.
//
// Principe directeur : ne rien inventer. Tout ce qui est ecrit provient soit
// de la base (marque, categorie, garantie), soit de caracteristiques lues
// dans la designation elle-meme. Aucune promesse commerciale, aucune
// specification supposee : un client qui compare deux fiches doit pouvoir se
// fier a ce qu'il lit.
//
// Par defaut seules les fiches encore brutes sont traitees (description egale
// a la designation en majuscules). --tout force la reecriture de toutes les
// fiches issues de l'inventaire.

import { readFileSync } from "node:fs";
import pg from "pg";

const flags = process.argv.slice(2);
const apply = flags.includes("--apply");
const tout = flags.includes("--tout");

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

// Nom de categorie utilise dans la phrase d'accroche. Le libelle affiche
// ("Peripheriques") ne se glisse pas dans une phrase, il faut un nom commun.
const NOM_CATEGORIE = {
  "pc-portables": "PC portable",
  "pc-bureau": "matériel bureautique",
  "all-in-one": "ordinateur tout-en-un",
  logiciels: "licence logicielle",
  impression: "consommable et matériel d'impression",
  "reseaux-connectivite": "équipement réseau",
  multimedia: "produit multimédia",
  peripheriques: "périphérique informatique",
  "securite-cameras": "équipement de vidéosurveillance",
  accessoires: "accessoire informatique",
  telephonie: "produit de téléphonie",
  stockage: "solution de stockage",
  "onduleurs-energie": "équipement d'alimentation",
  "baies-reseau-cablage": "élément de câblage réseau",
};

// Les asterisques et mentions internes servent de marqueurs au magasin
// ("*******exclu*******"). Elles n'ont rien a faire sur une fiche publique.
function nettoyerNom(nom) {
  return nom
    .replace(/\*+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function extraireSpecs(texte) {
  const t = texte.toUpperCase().replace(/,(\d)/g, ".$1");
  const specs = [];
  const vu = new Set();

  const ajouter = (valeur) => {
    if (valeur && !vu.has(valeur)) {
      vu.add(valeur);
      specs.push(valeur);
    }
  };

  const processeur = t.match(/\bI([3579])\b[- ]?(\d{4,5}[A-Z]{0,2})?/);
  if (processeur) {
    ajouter(`Processeur Intel Core i${processeur[1]}${processeur[2] ? ` ${processeur[2]}` : ""}`);
  } else if (/\bCELERON\b/.test(t)) ajouter("Processeur Intel Celeron");
  else if (/\bPENTIUM\b/.test(t)) ajouter("Processeur Intel Pentium");
  else if (/\bRYZEN\s?([357９])?/.test(t)) {
    const r = t.match(/\bRYZEN\s?([357])?/);
    ajouter(`Processeur AMD Ryzen${r[1] ? ` ${r[1]}` : ""}`);
  }

  const generation = t.match(/\b(\d{1,2})\s?EME\b/);
  if (generation) ajouter(`${generation[1]}e génération`);

  const frequence = t.match(/(\d+(?:\.\d+)?)\s?GHZ\b/);
  if (frequence) ajouter(`Fréquence ${frequence[1]} GHz`);

  // Deux capacites separees par "/" : la premiere est la memoire vive, la
  // seconde le stockage. C'est la convention de saisie du magasin
  // ("8GO/256GO SSD") et elle est constante sur tout l'inventaire.
  const paire = t.match(/(\d+)\s?G[OB]\s?\/\s?(\d+)\s?(G[OB]|T[OB])/);
  if (paire) {
    ajouter(`${paire[1]} Go de mémoire vive`);
    ajouter(`Stockage ${paire[2]} ${paire[3].startsWith("T") ? "To" : "Go"}`);
  } else {
    // Le magasin abrege parfois l'unite : "256G SSD", "RAM 8G". Le G seul
    // n'est donc accepte qu'accole a SSD/HDD/NVME ou precede de RAM, sans quoi
    // "GT 1030" ou "4G" seraient lus comme des capacites.
    const memoireExplicite = t.match(/\bRAM\s?(\d+)\s?G[OB]?\b/);
    const memoire =
      memoireExplicite ?? t.match(/\b(\d+)\s?G[OB]\b(?!\s?(SSD|HDD|NVME))/);
    const disque = t.match(/\b(\d+)\s?(G[OB]?|T[OB]?)\s?(SSD|HDD|NVME)\b/);

    if (disque) ajouter(`Stockage ${disque[1]} ${disque[2].startsWith("T") ? "To" : "Go"} ${disque[3]}`);
    if (memoireExplicite) ajouter(`${memoireExplicite[1]} Go de mémoire vive`);
    else if (disque) {
      // La capacite est deja decrite par le disque : ne rien ajouter.
    } else if (memoire && /\bRAM\b|\bDDR\d?\b/.test(t)) ajouter(`${memoire[1]} Go de mémoire`);
    else if (memoire && /DISQUE|SSD|HDD|MICRO SD|CLE USB|FLASH/.test(t)) {
      ajouter(`Capacité ${memoire[1]} Go`);
    } else if (memoire) ajouter(`${memoire[1]} Go`);
  }

  const ddr = t.match(/\bDDR([2-5])\b/);
  if (ddr) ajouter(`Mémoire DDR${ddr[1]}`);

  const ecran = t.match(/(\d{1,2}(?:\.\d)?)\s?(?:"|POUCES?|''|”)/);
  if (ecran) ajouter(`Écran ${ecran[1]} pouces`);

  const definition = t.match(/\b(4K|2K|3K|UHD|FHD|QHD|FULL HD)\b/);
  if (definition) ajouter(`Définition ${definition[1].replace("FULL HD", "Full HD")}`);

  const rafraichissement = t.match(/(\d{2,3})\s?HZ\b/);
  if (rafraichissement) ajouter(`${rafraichissement[1]} Hz`);

  const megapixels = t.match(/\b(\d+(?:\.\d+)?)\s?MP\b/);
  if (megapixels) ajouter(`Capteur ${megapixels[1]} MP`);

  const debit = t.match(/\b(\d+)\s?(MBPS|MPS|GBPS)\b/);
  if (debit) ajouter(`Débit ${debit[1]} ${debit[2] === "GBPS" ? "Gbit/s" : "Mbit/s"}`);

  const ports = t.match(/\b(\d+)\s?PORTS?\b/);
  if (ports) ajouter(`${ports[1]} ports`);

  const longueur = t.match(/\b(\d+(?:\.\d+)?)\s?(?:M|METRES?)\b/);
  if (longueur && /CABLE|CORDON|RALLONGE|BOBINE/.test(t)) {
    ajouter(`Longueur ${longueur[1]} m`);
  }

  const batterie = t.match(/\b(\d{3,6})\s?MAH\b/);
  if (batterie) ajouter(`Batterie ${batterie[1]} mAh`);

  const puissance = t.match(/\b(\d+)\s?W\b/);
  if (puissance) ajouter(`Puissance ${puissance[1]} W`);

  const tension = t.match(/\b(\d+(?:[.,]\d+)?)\s?V\b(?!GA)/);
  if (tension) ajouter(`Tension ${tension[1].replace(",", ".")} V`);

  const categorieCable = t.match(/\bCAT\s?([56]E?)\b|\bCATEGORIE\s?([56])\b/);
  if (categorieCable) ajouter(`Catégorie ${(categorieCable[1] ?? categorieCable[2]).toUpperCase()}`);

  for (const [motif, libelle] of [
    [/\bPOE\b/, "Alimentation PoE"],
    [/\bWIFI\b|\bSANS FIL\b|\bWIRELESS\b/, "Sans fil"],
    [/\bBLUETOOTH\b/, "Bluetooth"],
    [/\bTACTILE\b|\bTOUCH\b/, "Écran tactile"],
    [/\bRGB\b/, "Rétroéclairage RGB"],
    [/\bETANCHE\b|\bIP6[567]\b/, "Résistant aux intempéries"],
    [/\bCOLORVU\b/, "Vision nocturne couleur"],
    [/\bX360\b|\bYOGA\b/, "Écran rabattable à 360°"],
  ]) {
    if (motif.test(t)) ajouter(libelle);
  }

  return specs;
}

function redigerFiche({ nom, categorieSlug, marque, garantie }) {
  const specs = extraireSpecs(nom);
  const nomCategorie = NOM_CATEGORIE[categorieSlug] ?? "produit";
  const marqueConnue = marque && marque !== "Générique";

  const accroche = marqueConnue
    ? `${nom} : ${nomCategorie} ${marque} disponible chez Nahda Smart.`
    : `${nom} : ${nomCategorie} disponible chez Nahda Smart.`;

  const phrases = [accroche];

  if (specs.length > 0) {
    phrases.push(`Caractéristiques principales : ${specs.join(", ")}.`);
  }

  phrases.push(
    `Garantie ${garantie} mois. Livraison partout au Maroc, retrait possible en magasin. ` +
      `Notre équipe reste joignable pour vous conseiller avant l'achat.`,
  );

  // shortDescription alimente les cartes du catalogue : elle doit tenir sur
  // deux lignes. On prend les specs si on en a, sinon une phrase courte.
  const resume =
    specs.length > 0
      ? specs.slice(0, 4).join(" • ")
      : marqueConnue
        ? `${nomCategorie.charAt(0).toUpperCase()}${nomCategorie.slice(1)} ${marque}`
        : `${nomCategorie.charAt(0).toUpperCase()}${nomCategorie.slice(1)}`;

  return {
    shortDescription: resume.slice(0, 180),
    description: phrases.join(" "),
    seoTitle: `${nom} - Nahda Smart`.slice(0, 70),
    seoDescription: (specs.length > 0
      ? `${nom}. ${specs.slice(0, 5).join(", ")}. Garantie ${garantie} mois, livraison partout au Maroc.`
      : `${nom}. Disponible chez Nahda Smart, garantie ${garantie} mois, livraison partout au Maroc.`
    ).slice(0, 160),
    specsTrouvees: specs.length,
  };
}

const client = new pg.Client({ connectionString: databaseUrl });
const stats = { examines: 0, reecrits: 0, nomsNettoyes: 0, sansSpec: 0 };
const apercu = [];

try {
  await client.connect();

  // Une fiche encore brute est une fiche dont la description n'est que la
  // designation recopiee : soit integralement en majuscules, soit strictement
  // egale au nom du produit. Le seul test sur les majuscules laissait passer
  // les designations contenant une minuscule ("i7-10510u"), qui restaient
  // affichees telles quelles en boutique.
  const filtre = tout
    ? `p.description = upper(p.description)
       OR upper(btrim(p.description)) = upper(btrim(p.name))
       OR p."seoTitle" LIKE '%Nahda Smart'`
    : `p.description = upper(p.description) OR upper(btrim(p.description)) = upper(btrim(p.name))`;

  const { rows } = await client.query(`
    SELECT p.id, p.name, p."warrantyMonths", c.slug AS categorie, b.name AS marque
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      JOIN "Brand" b ON b.id = p."brandId"
     WHERE ${filtre}
     ORDER BY p.name
  `);

  if (apply) await client.query("BEGIN");

  for (const produit of rows) {
    stats.examines += 1;

    const nom = nettoyerNom(produit.name);
    if (nom !== produit.name) stats.nomsNettoyes += 1;

    const fiche = redigerFiche({
      nom,
      categorieSlug: produit.categorie,
      marque: produit.marque,
      garantie: produit.warrantyMonths,
    });

    if (fiche.specsTrouvees === 0) stats.sansSpec += 1;
    stats.reecrits += 1;

    if (apercu.length < 6) apercu.push({ nom, ...fiche });

    if (apply) {
      await client.query(
        `UPDATE "Product"
            SET name = $2,
                "shortDescription" = $3,
                description = $4,
                "seoTitle" = $5,
                "seoDescription" = $6,
                "updatedAt" = NOW()
          WHERE id = $1`,
        [
          produit.id,
          nom,
          fiche.shortDescription,
          fiche.description,
          fiche.seoTitle,
          fiche.seoDescription,
        ],
      );
    }
  }

  if (apply) await client.query("COMMIT");
} catch (erreur) {
  if (apply) await client.query("ROLLBACK").catch(() => {});
  console.error("Interrompu :", erreur.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

console.log(apply ? "=== FICHES REECRITES ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
console.log(`Fiches examinees        : ${stats.examines}`);
console.log(`Fiches reecrites        : ${stats.reecrits}`);
console.log(`  sans caracteristique  : ${stats.sansSpec}`);
console.log(`Noms nettoyes           : ${stats.nomsNettoyes}`);
console.log();

for (const a of apercu) {
  console.log(`--- ${a.nom}`);
  console.log(`    resume : ${a.shortDescription}`);
  console.log(`    fiche  : ${a.description}`);
}
