// Caracteristiques relevees a la main sur les fiches constructeur et
// revendeur, pour les produits qu'Icecat ne couvre pas.
//
// Utilisation :
//   node scripts/completer-fiches-recherchees.mjs
//
// Regle suivie pour le materiel d'occasion : la configuration (memoire,
// stockage) vient de la designation du magasin, qui seul connait la machine
// vendue. Le chassis (ecran, connectique, poids) vient du constructeur : il
// est constant pour le modele, et donc verifiable.
//
// Le tableau ci-dessous s'etoffe au fil des recherches. Relancer le script
// reecrit le bloc "Caracteristiques" sans toucher aux groupes Icecat.

const FICHES = {
  "LHO-840G6I78256": [
    ["Processeur", "Intel Core i7 de 8e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "14 pouces, 1920 x 1080 (Full HD), dalle IPS"],
    ["Connectique", "2x USB 3.1 Gen 1, 1x Thunderbolt (USB Type-C), HDMI 1.4b, RJ-45"],
    ["Batterie", "50 Wh, 3 cellules lithium-ion"],
    ["Poids", "1,48 kg"],
  ],
  "LLO-L13I5108256": [
    ["Processeur", "Intel Core i5 de 10e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "13,3 pouces, 1920 x 1080 (Full HD), dalle IPS antireflet"],
    ["Connectique", "2x USB Type-A, 2x USB Type-C (dont un Thunderbolt), HDMI"],
    ["Sans fil / réseau", "Wi-Fi 6, Bluetooth 5.1"],
    ["Poids", "1,39 kg pour 1,76 cm d'épaisseur"],
  ],
  "LHO-1040G7": [
    ["Processeur", "Intel Core i7 de 10e génération"],
    ["Mémoire vive", "16 Go"],
    ["Stockage", "512 Go SSD"],
    ["Écran", "14 pouces tactile, 1920 x 1080 (Full HD), dalle IPS, charnière 360°"],
    ["Connectique", "2x Thunderbolt 3, HDMI 1.4b, 2x USB 3.2 Gen 1 Type-A, jack 3,5 mm, emplacement nano-SIM"],
    ["Poids", "1,32 kg"],
  ],
  "IHN-137FNW": [
    ["Type", "Imprimante laser monochrome multifonction : impression, copie, numérisation, fax"],
    ["Vitesse d'impression", "Jusqu'à 20 pages par minute en A4"],
    ["Résolution", "1200 x 1200 ppp en impression, 600 x 600 ppp en numérisation"],
    ["Chargeur de documents", "Automatique, 40 pages"],
    ["Fax", "Résolution jusqu'à 300 x 300 ppp"],
    ["Sans fil / réseau", "Wi-Fi 802.11 b/g/n, Ethernet"],
    ["Volume mensuel", "Jusqu'à 10 000 pages"],
  ],
  "ALO-TIO22": [
    ["Type", "Écran 21,5 pouces recevant un module Tiny à l'arrière : l'ordinateur se loge dans l'écran"],
    ["Processeur", "Intel Core i5 de 8e génération"],
    ["Mémoire vive", "8 Go"],
    ["Stockage", "256 Go SSD"],
    ["Écran", "21,5 pouces, 1920 x 1080 (Full HD), dalle IPS, 250 cd/m², contraste 1000:1, angles 178°"],
    ["Connectique", "DisplayPort, 1x USB 3.1 Gen 1, entrée microphone"],
    ["Pied", "Inclinaison -5° à +30°, pivot 45° de chaque côté, réglage en hauteur sur 150 mm, rotation en portrait"],
  ],
  "PHN-300G3C30836": [
    ["Processeur", "Intel Core i3-8100, 4 cœurs, 3,6 GHz, 6 Mo de cache"],
    ["Carte graphique", "Intel UHD Graphics 630 intégrée"],
    ["Mémoire vive", "4 Go installés, extensible à 16 Go DDR4-2666"],
    ["Stockage", "1 To"],
    ["Chipset", "Intel B365"],
    ["Connectique", "HDMI, VGA"],
    ["Format", "Micro-tour"],
  ],
};

const url = readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)[1];
const c = new pg.Client({ connectionString: url });
await c.connect();

let ecrits = 0;
for (const [sku, lignes] of Object.entries(FICHES)) {
  const { rows } = await c.query(`SELECT id, name, "technicalDescription" FROM "Product" WHERE sku = $1`, [sku]);

  if (rows.length === 0) { console.log(`  introuvable : ${sku}`); continue; }

  let groupes = [];
  try {
    const existant = JSON.parse(rows[0].technicalDescription ?? "[]");
    if (Array.isArray(existant)) groupes = existant.filter((g) => g?.groupe !== "Caractéristiques");
  } catch { groupes = []; }

  groupes.unshift({ groupe: "Caractéristiques", lignes });

  await c.query(`UPDATE "Product" SET "technicalDescription" = $2, "updatedAt" = NOW() WHERE id = $1`,
    [rows[0].id, JSON.stringify(groupes)]);

  ecrits += 1;
  console.log(`  ${sku.padEnd(18)} ${lignes.length} caracteristiques  ${rows[0].name.slice(0, 44)}`);
}

console.log(`\nfiches ecrites : ${ecrits}`);
await c.end();
