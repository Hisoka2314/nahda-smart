// Alimentation des visuels du catalogue.
//
// Utilisation :
//   node scripts/import-product-images.mjs --source icecat [--apply]
//   node scripts/import-product-images.mjs --source dossier --chemin ./photos [--apply]
//
// Sans --apply, le script se contente d'un rapport : rien n'est ecrit, ni sur
// le disque ni en base.
//
// --- Source "icecat" -------------------------------------------------------
//
// Icecat est le catalogue ou les constructeurs deposent eux-memes photos et
// fiches pour que leurs revendeurs les utilisent : c'est une source licenciee,
// contrairement aux images trouvees dans un moteur de recherche.
//
// Le compte public "openIcecat" donne acces au catalogue ouvert. Certaines
// marques (Hikvision, Logitech...) exigent un compte Full Icecat, gratuit pour
// les revendeurs : fournir alors --app-key ou ICECAT_APP_KEY.
//
// L'appariement se fait sur la reference constructeur, qu'il faut deviner
// depuis le nom du produit. Le taux de reussite est donc limite par la facon
// dont le magasin nomme ses articles : "Ecran HP E243" est trouve, "PC
// Portable HP 840 G2 I5-2.50GHZ" ne l'est pas, la reference HP n'y figurant
// pas. Chaque correspondance est verifiee avant d'etre retenue.
//
// --- Source "dossier" ------------------------------------------------------
//
// Import en lot de photos prises par le magasin. Les fichiers sont nommes
// d'apres la reference du produit :
//
//   ACC4P.jpg          -> image principale de la reference ACC4P
//   ACC4P-2.jpg        -> deuxieme image du meme produit
//   CAN-001-3.png      -> troisieme image de CAN-001
//
// C'est la seule voie vers une couverture complete du catalogue, et les
// photos appartiennent alors au magasin.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";
import sharp from "sharp";

const flags = process.argv.slice(2);

function option(nom, defaut = undefined) {
  const i = flags.indexOf(nom);
  return i >= 0 && flags[i + 1] && !flags[i + 1].startsWith("--")
    ? flags[i + 1]
    : defaut;
}

const apply = flags.includes("--apply");
const source = option("--source");
const dossier = option("--chemin");
const appKey = option("--app-key", process.env.ICECAT_APP_KEY);
const limite = Number(option("--limit", "0")) || Infinity;

if (!["icecat", "constructeur", "vignette", "dossier"].includes(source)) {
  console.error(
    "Usage :\n" +
      "  node scripts/import-product-images.mjs --source icecat [--apply] [--app-key CLE] [--limit N]\n" +
      "  node scripts/import-product-images.mjs --source constructeur [--apply] [--limit N]\n" +
      "  node scripts/import-product-images.mjs --source vignette [--apply] [--limit N]\n" +
      "  node scripts/import-product-images.mjs --source dossier --chemin ./photos [--apply]",
  );
  process.exit(1);
}

if (source === "dossier" && !dossier) {
  console.error("--chemin est requis avec --source dossier.");
  process.exit(1);
}

const databaseUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!databaseUrl) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const racineUploads = path.resolve(
  process.env.UPLOADS_DIR?.trim() ??
    readFileSync(".env", "utf8").match(/UPLOADS_DIR="([^"]+)"/)?.[1] ??
    path.join(process.cwd(), "public", "uploads"),
);
const dossierProduits = path.join(racineUploads, "products");

// Un visuel de fiche produit n'a pas besoin de depasser cette taille : au dela
// on alourdit les pages sans rien gagner a l'ecran.
const COTE_MAX = 1200;
const POIDS_MAX_TELECHARGEMENT = 12 * 1024 * 1024;
const IMAGES_PAR_PRODUIT = 4;

// ---------------------------------------------------------------------------
// Traitement commun : normalisation en WebP et ecriture sur disque.
// ---------------------------------------------------------------------------

async function enregistrerImage(donnees, produit, rang) {
  // sharp echoue si le contenu n'est pas une image : c'est la validation.
  const image = sharp(donnees, { failOn: "error" });
  const meta = await image.metadata();

  if (!meta.width || !meta.height) {
    throw new Error("contenu illisible");
  }

  if (meta.width < 200 || meta.height < 200) {
    throw new Error(`trop petite (${meta.width}x${meta.height})`);
  }

  const sortie = await image
    .rotate()
    .resize({
      width: COTE_MAX,
      height: COTE_MAX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const nomFichier = `${crypto.randomUUID()}.webp`;

  if (apply) {
    await mkdir(dossierProduits, { recursive: true });
    await writeFile(path.join(dossierProduits, nomFichier), sortie, { flag: "wx" });
  }

  return {
    url: `/uploads/products/${nomFichier}`,
    alt: rang === 0 ? produit.name : `${produit.name} - visuel ${rang + 1}`,
    order: rang,
    octets: sortie.length,
  };
}

// ---------------------------------------------------------------------------
// Source Icecat.
// ---------------------------------------------------------------------------

// Tokens qui decrivent une caracteristique, jamais un modele.
const BRUIT = new Set([
  "SSD", "HDD", "NVME", "SATA", "USB", "HDMI", "VGA", "DVI", "RJ45", "BNC",
  "DDR2", "DDR3", "DDR4", "DDR5", "RAM", "GO", "GB", "TO", "TB", "MO", "MB",
  "CAT5", "CAT6", "POE", "WIFI", "LED", "LCD", "FHD", "UHD", "IPS", "OLED",
  "EME", "GHZ", "MHZ", "MAH", "MBPS", "CPU", "GPU", "UPS", "OTG", "MICROSD",
  "TYPE", "TYP", "PRO", "PLUS", "MAX", "MINI", "GAMING", "NOIR", "BLANC",
  "ORIGINAL", "NEW", "OEM", "2IN1", "3IN1", "COLORVU", "ETANCHE",
]);

function referencesCandidates(nom) {
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

function normaliser(texte) {
  return texte.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Consommables compatibles : la designation porte la reference du modele
// d'origine ("Toner Podium CF217A HP") parce que c'est ce que la cartouche
// remplace, pas ce qu'elle est. Icecat repondrait avec la photo de la
// cartouche HP authentique, et le client recevrait une Podium. On ecarte donc
// ces articles de l'appariement : leur photo devra etre prise en magasin.
const MARQUES_COMPATIBLES =
  /\b(PODIUM|STAR\s*INK|NEW\s*WORD|WORD|IMAX|COMPATIBLE|GENERIQUE|ADAPTABLE|REMANUFACTURE)\b/;

function estConsommableCompatible(nom) {
  return MARQUES_COMPATIBLES.test(nom.toUpperCase());
}

async function interrogerIcecat(marque, reference) {
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
// reference constructeur renvoyee : sans ce controle, on colle la photo d'un
// autre appareil sur la fiche, ce qui est pire que pas de photo du tout.
function ficheCorrespond(fiche, marque, reference) {
  const info = fiche.GeneralInfo ?? {};
  const marqueRenvoyee = normaliser(info.Brand ?? "");

  if (marqueRenvoyee && marqueRenvoyee !== normaliser(marque)) return false;

  const cible = normaliser(reference);
  const champs = [info.BrandPartCode, info.ProductName, info.Title]
    .filter(Boolean)
    .map(normaliser);

  return champs.some((champ) => champ.includes(cible));
}

// Quand un constructeur n'a fourni aucune photo, Icecat sert son logo a la
// place, y compris dans HighPic. Poser un logo HP sur une fiche d'ecran ne
// renseigne rien et laisse croire a une vraie photo : on ne retient que les
// visuels du produit.
function estLogoDeMarque(url, element) {
  if (element?.Type === "BrandLogo") return true;
  return /\/img\/brand\//.test(url);
}

function visuelsDeLaFiche(fiche) {
  const urls = [];
  const principale = fiche.Image?.HighPic ?? fiche.Image?.Pic500x500;

  if (principale && !estLogoDeMarque(principale)) urls.push(principale);

  for (const element of fiche.Gallery ?? []) {
    const url = element.Pic ?? element.Pic500x500;
    if (!url || estLogoDeMarque(url, element)) continue;
    if (!urls.includes(url)) urls.push(url);
  }

  return urls.slice(0, IMAGES_PAR_PRODUIT);
}

async function telecharger(url) {
  const reponse = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { "user-agent": "nahda-smart-catalogue/1.0" },
  });

  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);

  const type = reponse.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`type inattendu : ${type}`);

  const donnees = Buffer.from(await reponse.arrayBuffer());

  if (donnees.length > POIDS_MAX_TELECHARGEMENT) {
    throw new Error("fichier trop volumineux");
  }

  return donnees;
}

async function traiterIcecat(client, produits) {
  const stats = {
    examines: 0,
    apparies: 0,
    compatibles: 0,
    sansCandidat: 0,
    absents: 0,
    restreints: 0,
    images: 0,
    echecs: 0,
  };
  const marquesRestreintes = new Set();
  const reussites = [];

  for (const produit of produits) {
    if (stats.examines >= limite) break;
    stats.examines += 1;

    if (estConsommableCompatible(produit.name)) {
      stats.compatibles += 1;
      continue;
    }

    const candidats = referencesCandidates(produit.name);

    if (candidats.length === 0) {
      stats.sansCandidat += 1;
      continue;
    }

    let fiche = null;
    let referenceRetenue = null;

    for (const reference of candidats) {
      let resultat;

      try {
        resultat = await interrogerIcecat(produit.marque, reference);
      } catch {
        stats.echecs += 1;
        continue;
      }

      if (resultat.erreur === 403) {
        stats.restreints += 1;
        marquesRestreintes.add(produit.marque);
        break;
      }

      if (resultat.fiche && ficheCorrespond(resultat.fiche, produit.marque, reference)) {
        fiche = resultat.fiche;
        referenceRetenue = reference;
        break;
      }
    }

    if (!fiche) {
      stats.absents += 1;
      continue;
    }

    const urls = visuelsDeLaFiche(fiche);
    if (urls.length === 0) {
      stats.absents += 1;
      continue;
    }

    const enregistrees = [];

    for (const [rang, url] of urls.entries()) {
      try {
        const donnees = await telecharger(url);
        enregistrees.push(await enregistrerImage(donnees, produit, enregistrees.length));
      } catch {
        // Un visuel secondaire manquant n'invalide pas la fiche : seul l'echec
        // sur l'image principale est compte comme un echec.
        if (rang === 0) stats.echecs += 1;
      }
    }

    if (enregistrees.length === 0) {
      stats.absents += 1;
      continue;
    }

    stats.apparies += 1;
    stats.images += enregistrees.length;
    reussites.push({
      sku: produit.sku,
      nom: produit.name,
      reference: referenceRetenue,
      titre: fiche.GeneralInfo?.Title ?? "",
      images: enregistrees.length,
    });

    if (apply) await ecrireImages(client, produit, enregistrees);
  }

  return { stats, reussites, marquesRestreintes };
}

// ---------------------------------------------------------------------------
// Source constructeur : le site de la marque, pas un index d'images.
// ---------------------------------------------------------------------------
//
// Pour les marques absentes ou reservees chez Icecat, on va chercher la photo
// sur le site du fabricant lui-meme. Le sitemap publie donne la page de chaque
// modele, et le robots.txt du site autorise la lecture automatisee.
//
// C'est la meme legitimite que la mediatheque revendeur : la photo vient de
// celui qui fabrique le produit, pas d'un tiers qui l'a photographie.

const CONSTRUCTEURS = {
  Hikvision: {
    sitemap: "https://www.hikvision.com/en/sitemap.xml",
    // Les references Hikvision sont explicites : DS-2CE16D0T-EXIF, DS-7204HGHI.
    modele: /\b(I?DS-[A-Z0-9]+(?:-[A-Z0-9/]+)*)\b/,
    hote: "assets.hikvision.com",
  },
};

// Une page produit ne porte pas que la photo du produit : icones de
// caracteristiques, schemas cotes, accessoires suggeres. On ecarte les trois.
function estVisuelProduit(url) {
  if (/\/specicon\//.test(url)) return false;
  if (/Dimension/i.test(url)) return false;
  if (/\/img\/brand\//.test(url)) return false;

  // "....png.thumb.319.319.png" : vignette d'accessoire, trop petite.
  const vignette = url.match(/\.thumb\.(\d+)\.(\d+)\./);
  if (vignette && Number(vignette[1]) < 500) return false;

  return true;
}

const sitemapsCharges = new Map();

async function chargerSitemap(marque) {
  if (sitemapsCharges.has(marque)) return sitemapsCharges.get(marque);

  const config = CONSTRUCTEURS[marque];
  const reponse = await fetch(config.sitemap, {
    signal: AbortSignal.timeout(60000),
    headers: { "user-agent": "nahda-smart-catalogue/1.0" },
  });

  const xml = await reponse.text();
  const urls = xml.match(/https?:\/\/[^<\s]+/g) ?? [];
  const produits = urls.filter((u) => u.includes("/products/"));

  // Sans ce compte-rendu, un sitemap servi vide ou redirige vers une autre
  // region se traduisait par "page introuvable" sur chaque produit, sans dire
  // que la faute venait du sitemap et non des references.
  console.log(
    `  sitemap ${marque} : HTTP ${reponse.status}, ${urls.length} adresses dont ${produits.length} fiches produit`,
  );

  if (produits.length === 0) {
    console.log(`  -> aucune fiche produit dans ${reponse.url}`);
  }

  sitemapsCharges.set(marque, urls);

  return urls;
}

// Un suffixe de reference peut designer une declinaison regionale ("-eur-",
// "(C)") ou un modele different ("-4K", "-8P"). Seuls les premiers sont
// acceptes : coller la photo d'un NVR 4K sur la fiche d'un NVR 8 ports PoE
// serait aussi faux que prendre l'image d'une autre marque.
const SUFFIXES_ACCEPTES = /^-(c|f|b|i|o|s|eur|uk|us|in|latam)-?$/;

function pageDuModele(urls, modele) {
  const cible = modele.toLowerCase().replace(/\//g, "-");
  const exacte = urls.find((u) => u.toLowerCase().endsWith(`/${cible}/`));

  if (exacte) return exacte;

  for (const url of urls) {
    const dernier = url.toLowerCase().replace(/\/$/, "").split("/").pop();
    if (!dernier.startsWith(cible)) continue;
    if (SUFFIXES_ACCEPTES.test(dernier.slice(cible.length))) return url;
  }

  return null;
}

function visuelsDeLaPage(html, hote) {
  const brutes =
    html.match(new RegExp(`https?://${hote.replace(/\./g, "\\.")}/[^"'\\s<>)]+`, "g")) ?? [];

  const images = brutes.filter(
    (u) => /\.(png|jpe?g|webp)(\?|$)/i.test(u) && estVisuelProduit(u),
  );

  // Les visuels du produit vivent tous sous le meme identifiant d'actif ; les
  // accessoires suggeres sous un autre. On garde le groupe majoritaire.
  const parGroupe = new Map();

  for (const url of images) {
    const groupe = url.match(/\/image\/(m\d+)\//)?.[1] ?? "sansgroupe";
    if (!parGroupe.has(groupe)) parGroupe.set(groupe, []);
    parGroupe.get(groupe).push(url);
  }

  const dominant = [...parGroupe.values()].sort((a, b) => b.length - a.length)[0] ?? [];

  // Une meme photo est publiee en plusieurs tailles. On prend la plus grande
  // de chaque, en preferant l'originale a une vignette.
  const parPhoto = new Map();

  for (const url of dominant) {
    const base = url.replace(/\.thumb\.\d+\.\d+\.[a-z]+$/i, "").replace(/\.original\.[a-z]+$/i, "");
    const taille = Number(url.match(/\.thumb\.(\d+)\./)?.[1] ?? 99999);
    const actuel = parPhoto.get(base);

    if (!actuel || taille > actuel.taille) parPhoto.set(base, { url, taille });
  }

  return [...parPhoto.values()].map((v) => v.url).slice(0, IMAGES_PAR_PRODUIT);
}

async function traiterConstructeur(client, produits) {
  const stats = {
    examines: 0,
    apparies: 0,
    sansModele: 0,
    pageIntrouvable: 0,
    sansVisuel: 0,
    images: 0,
    echecs: 0,
  };
  const reussites = [];

  for (const produit of produits) {
    if (stats.examines >= limite) break;
    stats.examines += 1;

    const config = CONSTRUCTEURS[produit.marque];
    const modele = produit.name.toUpperCase().match(config.modele)?.[1];

    if (!modele) {
      stats.sansModele += 1;
      continue;
    }

    let page;

    try {
      const urls = await chargerSitemap(produit.marque);
      page = pageDuModele(urls, modele);
    } catch {
      stats.echecs += 1;
      continue;
    }

    if (!page) {
      stats.pageIntrouvable += 1;
      continue;
    }

    let visuels = [];

    try {
      const reponse = await fetch(page, {
        signal: AbortSignal.timeout(40000),
        headers: { "user-agent": "nahda-smart-catalogue/1.0" },
      });
      visuels = visuelsDeLaPage(await reponse.text(), config.hote);
    } catch {
      stats.echecs += 1;
      continue;
    }

    if (visuels.length === 0) {
      stats.sansVisuel += 1;
      continue;
    }

    const enregistrees = [];

    for (const [rang, url] of visuels.entries()) {
      try {
        // Les noms de fichiers comportent parfois des caracteres non ASCII.
        const donnees = await telecharger(encodeURI(url));
        enregistrees.push(await enregistrerImage(donnees, produit, enregistrees.length));
      } catch {
        if (rang === 0) stats.echecs += 1;
      }
    }

    if (enregistrees.length === 0) {
      stats.sansVisuel += 1;
      continue;
    }

    stats.apparies += 1;
    stats.images += enregistrees.length;
    reussites.push({
      sku: produit.sku,
      nom: produit.name,
      modele,
      page,
      images: enregistrees.length,
    });

    if (apply) await ecrireImages(client, produit, enregistrees);
  }

  return { stats, reussites };
}

// ---------------------------------------------------------------------------
// Source dossier.
// ---------------------------------------------------------------------------

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

async function traiterDossier(client, produits) {
  const stats = { fichiers: 0, apparies: 0, inconnus: 0, images: 0, echecs: 0 };
  const inconnus = [];
  const parSku = new Map(produits.map((p) => [p.sku.toUpperCase(), p]));
  const parProduit = new Map();

  const entrees = await readdir(dossier, { withFileTypes: true });

  for (const entree of entrees) {
    if (!entree.isFile()) continue;

    const extension = path.extname(entree.name).toLowerCase();
    if (!EXTENSIONS.has(extension)) continue;

    stats.fichiers += 1;

    const base = path.basename(entree.name, extension);
    // "CAN-001-3" : le suffixe numerique donne le rang, mais la reference peut
    // elle-meme contenir des tirets. On essaie donc la forme complete d'abord.
    let reference = base.toUpperCase();
    let rang = 0;

    if (!parSku.has(reference)) {
      const suffixe = base.match(/^(.*)-(\d{1,2})$/);
      if (suffixe && parSku.has(suffixe[1].toUpperCase())) {
        reference = suffixe[1].toUpperCase();
        rang = Number(suffixe[2]) - 1;
      }
    }

    const produit = parSku.get(reference);

    if (!produit) {
      stats.inconnus += 1;
      if (inconnus.length < 12) inconnus.push(entree.name);
      continue;
    }

    if (!parProduit.has(produit.sku)) parProduit.set(produit.sku, { produit, fichiers: [] });
    parProduit.get(produit.sku).fichiers.push({ chemin: path.join(dossier, entree.name), rang });
  }

  for (const { produit, fichiers } of parProduit.values()) {
    fichiers.sort((a, b) => a.rang - b.rang);
    const enregistrees = [];

    for (const fichier of fichiers.slice(0, IMAGES_PAR_PRODUIT)) {
      try {
        const donnees = await readFile(fichier.chemin);
        enregistrees.push(await enregistrerImage(donnees, produit, enregistrees.length));
      } catch (erreur) {
        stats.echecs += 1;
        console.error(`  ${path.basename(fichier.chemin)} : ${erreur.message}`);
      }
    }

    if (enregistrees.length === 0) continue;

    stats.apparies += 1;
    stats.images += enregistrees.length;

    if (apply) await ecrireImages(client, produit, enregistrees);
  }

  return { stats, inconnus };
}

// ---------------------------------------------------------------------------
// Source vignette : visuel d'attente genere.
// ---------------------------------------------------------------------------
//
// Pour les produits dont aucune photo n'existe (cables, supports, materiel
// generique), on compose une vignette aux couleurs du magasin portant la
// marque, le nom et un pictogramme de categorie.
//
// Ce n'est volontairement pas une fausse photo : mettre l'image d'un autre
// article tromperait le client sur ce qu'il achete. La vignette montre ce
// qu'on sait reellement du produit, et se remplace par une vraie prise de vue
// des qu'elle existe : --source dossier ecrase la vignette.

const OLIVE = "#55720f";
const OLIVE_SOMBRE = "#314507";
const ENCRE = "#111710";

// Pictogrammes simples, traces sur une grille de 100x100.
const PICTOGRAMMES = {
  "pc-portables": "M20 30h60v34H20z M12 70h76l-6 8H18z",
  "pc-bureau": "M28 20h44v60H28z M38 30h24v8H38z M38 46h24v4H38z M38 56h24v4H38z",
  "all-in-one": "M16 22h68v44H16z M44 66h12v10H44z M32 78h36v4H32z",
  peripheriques: "M14 26h72v40H14z M40 66h20v8H40z M30 76h40v4H30z",
  impression: "M24 24h52v18H24z M14 42h72v28H14z M28 70h44v14H28z",
  "securite-cameras": "M18 36h44v22H18z M62 40l18-8v26l-18-8z M32 58v14h6V58z",
  "reseaux-connectivite": "M12 54h76v18H12z M22 62h6v4h-6z M36 62h6v4h-6z M50 62h6v4h-6z M64 62h6v4h-6z M46 24h8v22h-8z",
  "baies-reseau-cablage": "M20 14h60v72H20z M28 24h44v10H28z M28 40h44v10H28z M28 56h44v10H28z",
  telephonie: "M32 12h36v76H32z M42 20h16v4H42z M44 78h12v4H44z",
  stockage: "M18 32h64v36H18z M28 42h10v6H28z M62 42h12v6H62z M28 56h44v4H28z",
  multimedia: "M14 24h72v44H14z M36 76h28v4H36z M44 40l16 10-16 10z",
  logiciels: "M20 20h60v60H20z M32 34h36v6H32z M32 48h24v6H32z M32 60h30v6H32z",
  accessoires: "M42 14h6v18h-6z M56 14h6v18h-6z M34 32h36v22H34z M46 54h12v14H46z M40 68h24v18H40z",
  "onduleurs-energie": "M28 16h44v68H28z M52 30l-14 24h12l-2 18 16-26H52z",
};

function couperTexte(texte, maxCaracteres, maxLignes) {
  const mots = texte.split(/\s+/);
  const lignes = [];
  let courante = "";

  for (const mot of mots) {
    const essai = courante ? `${courante} ${mot}` : mot;

    if (essai.length <= maxCaracteres) {
      courante = essai;
      continue;
    }

    if (courante) lignes.push(courante);
    courante = mot.length > maxCaracteres ? `${mot.slice(0, maxCaracteres - 1)}…` : mot;

    if (lignes.length === maxLignes) break;
  }

  if (courante && lignes.length < maxLignes) lignes.push(courante);

  return lignes.slice(0, maxLignes);
}

function echapper(texte) {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function composerVignette({ nom, marque, categorieSlug, categorieNom }) {
  const picto = PICTOGRAMMES[categorieSlug] ?? PICTOGRAMMES.accessoires;
  const lignes = couperTexte(nom, 26, 4);
  const hauteurTexte = lignes.length * 68;
  const departTexte = 760 - hauteurTexte / 2;
  const afficherMarque = marque && marque !== "Générique";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="fond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#edf4de"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#fond)"/>
  <rect x="0" y="0" width="1200" height="10" fill="${OLIVE}"/>
  <g transform="translate(360 200) scale(4.8)" fill="${OLIVE}" fill-opacity="0.22" fill-rule="evenodd">
    <path d="${picto}"/>
  </g>
  ${
    afficherMarque
      ? `<text x="600" y="150" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="44" font-weight="700" letter-spacing="6" fill="${OLIVE_SOMBRE}">${echapper(marque.toUpperCase())}</text>`
      : ""
  }
  ${lignes
    .map(
      (ligne, i) =>
        `<text x="600" y="${departTexte + i * 68}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="54" font-weight="700" fill="${ENCRE}">${echapper(ligne)}</text>`,
    )
    .join("\n  ")}
  <text x="600" y="1080" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="38" font-weight="600" letter-spacing="3" fill="${OLIVE}">${echapper(categorieNom.toUpperCase())}</text>
  <text x="600" y="1140" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="30" fill="#7a8a68">Photo en cours de préparation</text>
</svg>`;

  return Buffer.from(svg);
}

async function traiterVignettes(client, produits) {
  const stats = { generees: 0, echecs: 0 };

  for (const produit of produits) {
    if (stats.generees >= limite) break;

    try {
      const svg = composerVignette({
        nom: produit.name,
        marque: produit.marque,
        categorieSlug: produit.categorieSlug,
        categorieNom: produit.categorieNom,
      });

      const image = await enregistrerImage(svg, produit, 0);
      stats.generees += 1;

      if (apply) await ecrireImages(client, produit, [image]);
    } catch (erreur) {
      stats.echecs += 1;
      console.error(`  ${produit.sku} : ${erreur.message}`);
    }
  }

  return stats;
}

// ---------------------------------------------------------------------------

async function ecrireImages(client, produit, images) {
  // Les visuels du magasin remplacent ceux deja presents : c'est le sens de
  // l'operation, la photo reelle prime sur celle du constructeur.
  await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [produit.id]);

  for (const image of images) {
    await client.query(
      `INSERT INTO "ProductImage" (id, "productId", url, alt, "order")
       VALUES ($1, $2, $3, $4, $5)`,
      [crypto.randomUUID(), produit.id, image.url, image.alt, image.order],
    );
  }

  await client.query(`UPDATE "Product" SET "updatedAt" = NOW() WHERE id = $1`, [produit.id]);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

// Seuls les produits sans visuel sont concernes : le script est relancable
// sans ecraser un travail deja fait.
const { rows: produits } = await client.query(`
  SELECT p.id, p.sku, p.name, p.status AS statut, b.name AS marque,
         c.slug AS "categorieSlug", c.name AS "categorieNom"
    FROM "Product" p
    JOIN "Brand" b ON b.id = p."brandId"
    JOIN "Category" c ON c.id = p."categoryId"
   WHERE p.status <> 'ARCHIVED'
     AND NOT EXISTS (SELECT 1 FROM "ProductImage" i WHERE i."productId" = p.id)
   ORDER BY p.name`);

console.log(apply ? "=== IMPORT APPLIQUE ===" : "=== SIMULATION (ajouter --apply pour ecrire) ===");
console.log(`Produits sans visuel : ${produits.length}`);
console.log(`Dossier de sortie    : ${dossierProduits}`);
console.log();

if (source === "icecat") {
  const eligibles = produits.filter((p) => p.marque !== "Générique");
  console.log(`Marque identifiee    : ${eligibles.length}`);
  console.log("Interrogation d'Icecat, quelques minutes...\n");

  const { stats, reussites, marquesRestreintes } = await traiterIcecat(client, eligibles);

  for (const r of reussites) {
    console.log(`OK  ${r.sku.padEnd(18)} ${r.nom.slice(0, 40).padEnd(40)} [${r.reference}] ${r.images} visuel(s)`);
    console.log(`    Icecat : ${r.titre.slice(0, 78)}`);
  }

  console.log();
  console.log(`Produits examines        : ${stats.examines}`);
  console.log(`Fiches trouvees          : ${stats.apparies}`);
  console.log(`Visuels enregistres      : ${stats.images}`);
  console.log(`Sans reference exploitable: ${stats.sansCandidat}`);
  console.log(`Consommables compatibles : ${stats.compatibles}`);
  console.log(`Absents du catalogue     : ${stats.absents}`);
  console.log(`Bloques (compte requis)  : ${stats.restreints}`);
  console.log(`Erreurs reseau/image     : ${stats.echecs}`);

  if (marquesRestreintes.size > 0) {
    console.log();
    console.log(`Marques exigeant une cle Full Icecat : ${Array.from(marquesRestreintes).join(", ")}`);
    console.log("Relancer avec --app-key <cle> une fois le compte revendeur cree.");
  }
} else if (source === "constructeur") {
  const eligibles = produits.filter((p) => CONSTRUCTEURS[p.marque]);
  console.log(`Marques couvertes    : ${Object.keys(CONSTRUCTEURS).join(", ")}`);
  console.log(`Produits concernes   : ${eligibles.length}`);
  console.log("Lecture des sitemaps constructeurs...");
  console.log();

  const { stats, reussites } = await traiterConstructeur(client, eligibles);

  for (const r of reussites) {
    console.log(`OK  ${r.sku.padEnd(18)} ${r.nom.slice(0, 40).padEnd(40)} [${r.modele}] ${r.images} visuel(s)`);
    console.log(`    ${r.page}`);
  }

  console.log();
  console.log(`Produits examines     : ${stats.examines}`);
  console.log(`Fiches illustrees     : ${stats.apparies}`);
  console.log(`Visuels enregistres   : ${stats.images}`);
  console.log(`Sans reference modele : ${stats.sansModele}`);
  console.log(`Page introuvable      : ${stats.pageIntrouvable}`);
  console.log(`Page sans photo       : ${stats.sansVisuel}`);
  console.log(`Erreurs reseau/image  : ${stats.echecs}`);
} else if (source === "vignette") {
  // Seuls les produits en ligne meritent une vignette : un brouillon n'est
  // visible de personne.
  const eligibles = produits.filter((p) => p.statut === "PUBLISHED");
  console.log(`Produits en ligne sans visuel : ${eligibles.length}`);
  console.log();

  const stats = await traiterVignettes(client, eligibles);

  console.log(`Vignettes generees   : ${stats.generees}`);
  console.log(`Echecs               : ${stats.echecs}`);
} else {
  const { stats, inconnus } = await traiterDossier(client, produits);

  console.log(`Fichiers image lus       : ${stats.fichiers}`);
  console.log(`Produits illustres       : ${stats.apparies}`);
  console.log(`Visuels enregistres      : ${stats.images}`);
  console.log(`Fichiers sans produit    : ${stats.inconnus}`);
  console.log(`Fichiers illisibles      : ${stats.echecs}`);

  if (inconnus.length > 0) {
    console.log();
    console.log("Aucun produit ne porte ces references :");
    inconnus.forEach((n) => console.log(`   ${n}`));
  }
}

await client.end();
