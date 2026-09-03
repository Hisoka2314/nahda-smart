// Import de l'inventaire magasin vers le catalogue.
//
// Utilisation :
//   node scripts/import-inventory.mjs <fichier.csv> [--apply]
//
// Sans --apply, le script se contente d'un rapport : aucune ecriture.
//
// Le CSV attendu a quatre colonnes : famille,reference,designation,quantite
// (export de "Saisie d'inventaire", converti en CSV).
//
// Regles appliquees :
//   - Les produits sont crees en BROUILLON avec un prix a zero. Ils n'appa-
//     raissent donc pas sur la boutique tant que les prix ne sont pas saisis
//     et le statut passe a PUBLISHED depuis le back-office.
//   - La reference d'inventaire devient le SKU : c'est la cle de rapprochement
//     avec le magasin, elle n'est jamais reecrite.
//   - Le code FAMILLE determine la categorie (voir FAMILLE_VERS_CATEGORIE).
//   - La marque est deduite de la designation ; a defaut le produit rejoint
//     une marque "Generique", le schema exigeant une marque par produit.
//   - Le stock est place dans le depot principal.
//   - Le script est idempotent : un SKU deja present est ignore, jamais
//     ecrase. Relancable apres un nouvel inventaire.

import { readFileSync } from "node:fs";
import pg from "pg";

const [, , csvPath, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!csvPath) {
  console.error("Usage : node scripts/import-inventory.mjs <fichier.csv> [--apply]");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const FAMILLE_VERS_CATEGORIE = {
  LPT: "pc-portables", PTBL: "pc-portables", BAT: "pc-portables", CHG: "pc-portables",
  PC: "all-in-one",
  UC: "pc-bureau", MB: "pc-bureau", CPU: "pc-bureau", ALM: "pc-bureau",
  BALM: "pc-bureau", CALM: "pc-bureau",
  ECR: "peripheriques", SRS: "peripheriques", CLV: "peripheriques",
  WCAM: "peripheriques", ACLV: "peripheriques", SCN: "peripheriques", KVM: "peripheriques",
  TNR: "impression", CRT: "impression", IMP: "impression", CIMP: "impression", FAX: "impression",
  TEL: "telephonie", CTEL: "telephonie", STEL: "telephonie", PB: "telephonie",
  TAB: "telephonie", PN: "telephonie",
  CRES: "baies-reseau-cablage", BNC: "baies-reseau-cablage", CBNC: "baies-reseau-cablage",
  RACK: "baies-reseau-cablage", PAT: "baies-reseau-cablage", CPL: "baies-reseau-cablage",
  CAM: "securite-cameras", SCAM: "securite-cameras", ALR: "securite-cameras",
  DVR: "securite-cameras", CPTZ: "securite-cameras", VIR: "securite-cameras",
  CWIFI: "reseaux-connectivite", RTR: "reseaux-connectivite", SWCH: "reseaux-connectivite",
  PAC: "reseaux-connectivite", ML: "reseaux-connectivite",
  DD: "stockage", BDD: "stockage", CSD: "stockage", CD: "stockage",
  DVD: "stockage", CDS: "stockage",
  HP: "multimedia", ECT: "multimedia", CSQ: "multimedia", TV: "multimedia",
  STV: "multimedia", TVB: "multimedia", VP: "multimedia", EVP: "multimedia",
  PLAY: "multimedia", BAR: "multimedia",
  SOFT: "logiciels",
  RAM: "accessoires", ADAP: "accessoires", PIL: "accessoires", VNT: "accessoires",
  CRTB: "accessoires", HUSB: "accessoires", RUSB: "accessoires", POT: "accessoires",
  CS: "accessoires", EMB: "accessoires", ARM: "accessoires", ETG: "accessoires",
  ACI: "accessoires", ACHG: "accessoires", CHDMI: "accessoires", CVGA: "accessoires",
  CUSB: "accessoires", SHDMI: "accessoires", VGA: "accessoires", CAC: "accessoires",
  CAPL: "accessoires", CHC: "accessoires", CCHG: "accessoires", CM: "accessoires",
  CRU: "accessoires", LCT: "accessoires", MAT: "accessoires", RLG: "accessoires",
  SN: "accessoires", VL: "accessoires", PRS: "accessoires", PBR: "accessoires",
  MLD: "accessoires", ELEC: "accessoires", PCB: "accessoires", PLT: "accessoires",
  PRA: "accessoires", LCM: "accessoires", AFF: "accessoires", BTG: "accessoires",
  CALC: "accessoires", RP: "accessoires",
};

const CATEGORIE_PAR_DEFAUT = "accessoires";

// Ordonnee du plus long au plus court : "TP-LINK" doit etre teste avant "TP".
const MARQUES = [
  ["HIKVISION", "Hikvision"], ["GRANDSTREAM", "Grandstream"], ["PANASONIC", "Panasonic"],
  ["LOGITECH", "Logitech"], ["HONEYWELL", "Honeywell"], ["MICROSOFT", "Microsoft"],
  ["KINGSTON", "Kingston"], ["VERBATIM", "Verbatim"], ["SAMSUNG", "Samsung"],
  ["GIGABYTE", "Gigabyte"], ["UBIQUITI", "Ubiquiti"], ["TOSHIBA", "Toshiba"],
  ["SANDISK", "SanDisk"], ["KYOCERA", "Kyocera"], ["LEXMARK", "Lexmark"],
  ["SEAGATE", "Seagate"], ["BROTHER", "Brother"], ["PHILIPS", "Philips"],
  ["SYLVANIA", "Sylvania"], ["TP-LINK", "TP-Link"], ["TPLINK", "TP-Link"],
  ["D-LINK", "D-Link"], ["DLINK", "D-Link"], ["ZKTECO", "ZKTeco"],
  ["LENOVO", "Lenovo"], ["YEALINK", "Yealink"], ["HUAWEI", "Huawei"],
  ["XIAOMI", "Xiaomi"], ["ORAIMO", "Oraimo"], ["EZVIZ", "EZVIZ"],
  ["ARCTIC", "Arctic"], ["CANON", "Canon"], ["EPSON", "Epson"],
  ["DAHUA", "Dahua"], ["ZEBRA", "Zebra"], ["HENEX", "Henex"],
  ["SYBEL", "Sybel"], ["MUTEX", "Mutex"], ["XEROX", "Xerox"],
  ["APPLE", "Apple"], ["IPHONE", "Apple"], ["INTEL", "Intel"],
  ["ASUS", "ASUS"], ["ACER", "Acer"], ["SONY", "Sony"],
  ["BENQ", "BenQ"], ["DELL", "Dell"], ["OMEGA", "Omega"],
  ["ANKER", "Anker"], ["HAVIT", "Havit"], ["TRUST", "Trust"],
  ["RAPOO", "Rapoo"], ["CISCO", "Cisco"], ["EATON", "Eaton"],
  ["MERCURY", "Mercury"], ["EXTROM", "Extrom"], ["ADATA", "ADATA"],
  ["TENDA", "Tenda"], ["REMAX", "Remax"], ["INTEX", "Intex"], ["HOCO", "Hoco"],
  ["MSI", "MSI"], ["AMD", "AMD"], ["APC", "APC"],
  ["JBL", "JBL"], ["LG", "LG"], ["WD", "Western Digital"], ["HP", "HP"],
];

const MARQUE_GENERIQUE = "Générique";

function detecterMarque(designation) {
  const texte = designation.toUpperCase();

  for (const [motif, nom] of MARQUES) {
    const regex = new RegExp(`(?<![A-Z0-9])${motif.replace(/[-]/g, "\\-")}(?![A-Z0-9])`);
    if (regex.test(texte)) return nom;
  }

  return MARQUE_GENERIQUE;
}

// Sigles techniques a laisser en capitales : sans cette liste, la mise en
// casse titre produit "Ram 8 Gb Ddr4 Ssd" au lieu de "RAM 8 GB DDR4 SSD".
const SIGLES = new Set([
  "RAM", "ROM", "GB", "GO", "TB", "TO", "MB", "MO", "KB", "KO",
  "DDR", "DDR2", "DDR3", "DDR4", "DDR5", "SSD", "HDD", "NVME", "SATA", "IDE",
  "USB", "HDMI", "VGA", "DVI", "RJ45", "BNC", "OTG", "KVM", "PCI", "PCIE",
  "LED", "LCD", "OLED", "IPS", "TFT", "HD", "FHD", "UHD",
  "PC", "TV", "UC", "CPU", "GPU", "ITX", "ATX", "PSU",
  "POE", "WIFI", "LAN", "WAN", "IP", "PTZ", "DVR", "NVR", "CCTV", "ONVIF",
  "UTP", "FTP", "STP", "SIM", "GSM", "VOIP", "PABX", "IPBX", "NFC",
  "SD", "MICROSD", "MMC", "AIO", "OEM", "AC", "DC", "UPS", "AVR",
  "PDF", "OCR", "ADF", "MFP",
  "GT", "GTX", "RTX", "RX", "LPT",
]);

// Casse d'affichage des mots de marque DANS LE NOM du produit. A ne pas
// confondre avec l'attribution de marque : "IPHONE" rattache le produit a la
// marque Apple, mais le nom doit rester "iPhone", pas "Apple".
const CASSE_MOTS = new Map([
  ["IPHONE", "iPhone"], ["IPAD", "iPad"], ["IMAC", "iMac"], ["MACBOOK", "MacBook"],
  ["TP-LINK", "TP-Link"], ["TPLINK", "TP-Link"], ["D-LINK", "D-Link"], ["DLINK", "D-Link"],
  ["ZKTECO", "ZKTeco"], ["SANDISK", "SanDisk"], ["EZVIZ", "EZVIZ"], ["BENQ", "BenQ"],
  ["MSI", "MSI"], ["ASUS", "ASUS"], ["HP", "HP"], ["LG", "LG"], ["JBL", "JBL"],
  ["APC", "APC"], ["AMD", "AMD"], ["WD", "WD"], ["SFP", "SFP"],
  ["HIKVISION", "Hikvision"], ["LENOVO", "Lenovo"], ["SAMSUNG", "Samsung"],
  ["LOGITECH", "Logitech"], ["KINGSTON", "Kingston"], ["TOSHIBA", "Toshiba"],
  ["ADATA", "ADATA"], ["GHZ", "GHz"], ["MHZ", "MHz"], ["MAH", "mAh"],
]);

// Les designations d'inventaire sont en majuscules : "CABLE HDMI 7M" devient
// "Cable HDMI 7M", plus lisible sur une fiche produit.
function enCasseTitre(texte) {
  const base = texte
    .toLocaleLowerCase("fr")
    .replace(/(^|[\s'’(\-/])([\p{L}])/gu, (_, sep, lettre) => sep + lettre.toLocaleUpperCase("fr"));

  // Le mot inclut ses tirets et points internes : sans cela "TP-LINK" et
  // "DS-2CE76K0T-LMFS" etaient decoupes puis recases morceau par morceau,
  // donnant "Tp-Link" et "Ds-2CE76K0T-Lmfs".
  return base.replace(/[\p{L}\p{N}]+(?:[-.][\p{L}\p{N}]+)*/gu, (mot) => {
    const majuscule = mot.toUpperCase();

    if (SIGLES.has(majuscule)) return majuscule;
    if (CASSE_MOTS.has(majuscule)) return CASSE_MOTS.get(majuscule);

    // "8go", "2.4ghz", "19v", "90w" : un nombre colle a son unite.
    const unite = majuscule.match(/^(\d+)(GO|GB|TO|TB|MO|MB|W|V|A|MM|CM|M|GHZ|MHZ|K|P|VA|DBI|MBPS|MAH)$/);
    if (unite) return `${unite[1]}${unite[2]}`;

    // Reference alphanumerique type "GT1030", "CAT6", "DS-2CE76K0T" : brut.
    if (/\d/.test(majuscule) && /[A-Z]/.test(majuscule)) return majuscule;

    return mot;
  });
}

function versSlug(texte) {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function decouperLigneCsv(ligne) {
  const cellules = [];
  let courant = "";
  let dansGuillemets = false;

  for (let i = 0; i < ligne.length; i += 1) {
    const c = ligne[i];

    if (dansGuillemets) {
      if (c === '"' && ligne[i + 1] === '"') { courant += '"'; i += 1; }
      else if (c === '"') dansGuillemets = false;
      else courant += c;
    } else if (c === '"') dansGuillemets = true;
    else if (c === ",") { cellules.push(courant); courant = ""; }
    else courant += c;
  }

  cellules.push(courant);
  return cellules;
}

function lireCsv(texte) {
  const lignes = texte.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const entetes = decouperLigneCsv(lignes[0]).map((h) => h.trim().toLowerCase());

  return lignes.slice(1).map((ligne) => {
    const cellules = decouperLigneCsv(ligne);
    return Object.fromEntries(entetes.map((h, i) => [h, (cellules[i] ?? "").trim()]));
  });
}

const lignes = lireCsv(readFileSync(csvPath, "utf8"));
const client = new pg.Client({ connectionString: databaseUrl });

const stats = {
  lues: lignes.length,
  sansDesignation: 0,
  sansReference: 0,
  doublonReference: 0,
  dejaEnBase: 0,
  aImporter: 0,
  importes: 0,
  stockEcrit: 0,
  marquesCreees: 0,
};

try {
  await client.connect();

  const categories = new Map(
    (await client.query('SELECT slug, id FROM "Category"')).rows.map((r) => [r.slug, r.id]),
  );
  const marques = new Map(
    (await client.query('SELECT upper(name) AS n, id FROM "Brand"')).rows.map((r) => [r.n, r.id]),
  );
  const skusConnus = new Set(
    (await client.query('SELECT sku FROM "Product"')).rows.map((r) => r.sku),
  );
  const slugsConnus = new Set(
    (await client.query('SELECT slug FROM "Product"')).rows.map((r) => r.slug),
  );

  const depot = (
    await client.query(
      `SELECT id, name FROM "Depot" WHERE "isActive" ORDER BY (type = 'MAIN_DEPOT') DESC LIMIT 1`,
    )
  ).rows[0];

  if (!depot) throw new Error("Aucun depot actif : creez-en un avant l'import.");

  const vus = new Set();
  const candidats = [];

  for (const ligne of lignes) {
    const designation = ligne.designation?.trim();

    if (!designation) { stats.sansDesignation += 1; continue; }

    let sku = ligne.reference?.trim().toUpperCase();

    if (!sku) { sku = `INV-${versSlug(designation).slice(0, 24).toUpperCase()}`; stats.sansReference += 1; }
    if (vus.has(sku)) { stats.doublonReference += 1; continue; }

    vus.add(sku);

    if (skusConnus.has(sku)) { stats.dejaEnBase += 1; continue; }

    const nom = enCasseTitre(designation);
    let slug = versSlug(nom);

    if (!slug) slug = versSlug(sku);
    if (slugsConnus.has(slug)) slug = `${slug}-${versSlug(sku)}`.slice(0, 90);

    slugsConnus.add(slug);

    const quantite = Number.parseInt(ligne.quantite || "0", 10) || 0;

    candidats.push({
      sku,
      slug,
      nom,
      designation,
      marque: detecterMarque(designation),
      categorie: FAMILLE_VERS_CATEGORIE[ligne.famille?.toUpperCase()] ?? CATEGORIE_PAR_DEFAUT,
      quantite: Math.max(0, quantite),
    });
  }

  stats.aImporter = candidats.length;

  const marquesRequises = [...new Set(candidats.map((c) => c.marque))];
  const marquesAbsentes = marquesRequises.filter((m) => !marques.has(m.toUpperCase()));

  console.log("");
  console.log(apply ? "=== IMPORT INVENTAIRE ===" : "=== SIMULATION (ajoutez --apply pour ecrire) ===");
  console.log(`  Lignes lues                : ${stats.lues}`);
  console.log(`  Ignorees, sans designation : ${stats.sansDesignation}`);
  console.log(`  Ignorees, doublon SKU      : ${stats.doublonReference}`);
  console.log(`  Ignorees, deja en base     : ${stats.dejaEnBase}`);
  console.log(`  A importer                 : ${stats.aImporter}`);
  console.log(`  Reference absente, generee : ${stats.sansReference}`);
  console.log("");
  console.log(`  Depot du stock             : ${depot.name}`);
  console.log(`  Marques a creer (${marquesAbsentes.length}) : ${marquesAbsentes.join(", ") || "aucune"}`);

  const parCategorie = candidats.reduce((acc, c) => {
    acc[c.categorie] = (acc[c.categorie] ?? 0) + 1;
    return acc;
  }, {});

  console.log("");
  console.log("  Repartition :");
  for (const [cat, n] of Object.entries(parCategorie).sort((a, b) => b[1] - a[1])) {
    const connue = categories.has(cat) ? "" : "  <-- CATEGORIE INTROUVABLE";
    console.log(`    ${cat.padEnd(24)} ${String(n).padStart(4)}${connue}`);
  }

  if (!apply) {
    console.log("");
    console.log(">>> SIMULATION. Relancer avec --apply pour executer.");
    process.exit(0);
  }

  for (const nom of marquesAbsentes) {
    const res = await client.query(
      `INSERT INTO "Brand" (id, name, slug, "isActive", "isOfficialAsset", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, true, false, now(), now())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [nom, versSlug(nom)],
    );
    marques.set(nom.toUpperCase(), res.rows[0].id);
    stats.marquesCreees += 1;
  }

  for (const c of candidats) {
    const categorieId = categories.get(c.categorie) ?? categories.get(CATEGORIE_PAR_DEFAUT);
    const marqueId = marques.get(c.marque.toUpperCase());

    if (!categorieId || !marqueId) {
      console.log(`    ! ignore ${c.sku} (categorie ou marque introuvable)`);
      continue;
    }

    const produit = await client.query(
      `INSERT INTO "Product"
         (id, name, slug, sku, "brandId", "categoryId", description, "shortDescription",
          "priceBuy", "priceSell", "warrantyMonths", condition, status,
          "isPromo", "isNew", "isRecommended", "isBestSeller", "reviewCount",
          "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $6,
               0, 0, 12, 'NEW', 'DRAFT', false, false, false, false, 0, now(), now())
       ON CONFLICT (sku) DO NOTHING
       RETURNING id`,
      [c.nom, c.slug, c.sku, marqueId, categorieId, c.designation],
    );

    if (produit.rowCount === 0) continue;

    stats.importes += 1;

    if (c.quantite > 0) {
      await client.query(
        `INSERT INTO "Stock" (id, "productId", "depotId", quantity, "lowStockThreshold")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 3)
         ON CONFLICT ("productId", "depotId") DO UPDATE SET quantity = EXCLUDED.quantity`,
        [produit.rows[0].id, depot.id, c.quantite],
      );
      stats.stockEcrit += 1;
    }

    if (stats.importes % 100 === 0) {
      process.stdout.write(`\r  insertion... ${stats.importes}/${candidats.length}`);
    }
  }

  process.stdout.write("\r".padEnd(60) + "\r");
  console.log("");
  console.log(`  Marques creees             : ${stats.marquesCreees}`);
  console.log(`  Produits importes          : ${stats.importes}`);
  console.log(`  Lignes de stock ecrites    : ${stats.stockEcrit}`);
  console.log("");
  console.log("  Tous en BROUILLON, prix a 0 : rien n'est visible sur la boutique.");
} finally {
  await client.end();
}
