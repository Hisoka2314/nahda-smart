export const normaliserOption = (value, slug = "") => {
  let text = String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "");
  text = text.replace(/gb/g, "go").replace(/tb/g, "to");
  if (slug === "processor") text = text.replace(/intel|amd/g, "");
  return text;
};

const uncertain = /(?:a confirmer|a verifier|selon|variable|optionnel|jusqu|a partir|environ|ou )/i;
const aliases = {
  ram: ["ram", "memoire vive", "memoire ram"], processor: ["processeur", "cpu"],
  processorGeneration: ["processeur", "generation processeur"], storageCapacity: ["stockage", "capacite de stockage"],
  storageType: ["stockage", "type stockage", "type de stockage"], screenSize: ["ecran", "taille ecran"],
  resolution: ["resolution", "resolution ecran", "ecran"], panelType: ["type ecran", "type de dalle", "ecran"],
  weight: ["poids", "weight"], graphics: ["carte graphique", "processeur graphique", "gpu"],
  batteryWh: ["batterie", "batterie wh"], bluetooth: ["bluetooth"], wifiStandard: ["wifi", "wi-fi"], touch: ["tactile", "ecran"],
};
const canon = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
function parse(slug, text) {
  if (slug === "ram") return text.match(/\b(\d+)\s*(?:go|gb)\b/i)?.[1] ? `${text.match(/\b(\d+)\s*(?:go|gb)\b/i)[1]} Go` : undefined;
  if (slug === "storageCapacity") { const m = text.match(/\b(\d+(?:[.,]\d+)?)\s*(go|gb|to|tb)\s*(?=ssd|hdd|nvme|m\.2|disque|stockage)/i); return m ? `${m[1].replace(",", ".")} ${/^g/i.test(m[2]) ? "Go" : "To"}` : undefined; }
  if (slug === "processor") { const m = text.match(/\b(?:intel\s+)?core\s*i([3579])\b|\b(?:amd\s+)?ryzen\s+([3579])\b|\b(celeron|pentium|xeon)\b/i); return m ? m[1] ? `Intel Core i${m[1]}` : m[2] ? `AMD Ryzen ${m[2]}` : `Intel ${m[3]}` : undefined; }
  if (slug === "processorGeneration") { const m = text.match(/\b(\d{1,2})(?:e|eme|ème)\b/i); return m ? `${m[1]}e génération` : undefined; }
  if (slug === "screenSize") { const m = text.match(/(\d{1,2}(?:[.,]\d+)?)\s*(?:pouces|inch|["″])/i); return m ? `${m[1].replace(",", ".")} pouces` : undefined; }
  if (slug === "resolution") { const m = text.match(/\b(\d{3,4})\s*[x×]\s*(\d{3,4})\b/); return m ? `${m[1]} x ${m[2]}` : undefined; }
  if (slug === "panelType") return text.match(/\b(IPS|OLED|TN|VA)\b/i)?.[1]?.toUpperCase();
  if (slug === "weight") { const m = text.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i); return m ? `${m[1].replace(",", ".")} kg` : undefined; }
  if (slug === "batteryWh") { const m = text.match(/(\d+(?:[.,]\d+)?)\s*Wh\b/i); return m ? `${m[1].replace(",", ".")} Wh` : undefined; }
  if (slug === "storageType") return text.match(/\b(SSD|HDD|NVMe|M\.2)\b/i)?.[1].toUpperCase();
  if (slug === "bluetooth") { const m = text.match(/Bluetooth\s*([0-9.]+)/i); return m ? `Bluetooth ${m[1]}` : undefined; }
  if (slug === "wifiStandard") { const m = text.match(/Wi-?Fi\s*(6E|[4567])\b/i); return m ? `Wi-Fi ${m[1].toUpperCase()}` : undefined; }
  if (slug === "touch") { if (/non tactile|sans tactile/i.test(text)) return false; if (/tactile|touchscreen/i.test(text)) return true; }
  if (slug === "graphics") return uncertain.test(text) ? undefined : text.match(/(?:NVIDIA|AMD|Intel)\s+(?:GeForce|Radeon|Iris|UHD|RTX|GTX)\s*[A-Z0-9 -]{2,20}/i)?.[0]?.trim();
}

export function extraireAttributs(product, definitions = []) {
  const lignes = [];
  try { for (const g of JSON.parse(product.technicalDescription || "[]")) for (const l of (g?.lignes || [])) if (Array.isArray(l) && typeof l[0] === "string" && typeof l[1] === "string") lignes.push([canon(l[0]), l[1], `${g.groupe || "Fiche"} / ${l[0]}`]); } catch { return { values: [], issues: [{ reason: "Fiche JSON invalide" }] }; }
  const targets = new Set([...Object.keys(aliases), ...definitions.map((d) => d.slug)]); const values = [], issues = [];
  for (const slug of targets) {
    const candidates = [];
    for (const [label, text, source] of lignes.filter(([label]) => (aliases[slug] || []).includes(label) || definitions.find((d) => d.slug === slug && canon(d.label) === label))) {
      if (uncertain.test(text)) { issues.push({ slug, source, evidence: text, reason: "Valeur incertaine" }); continue; }
      const value = parse(slug, text); if (value !== undefined) candidates.push({ slug, value, source, evidence: text });
    }
    const distinct = [...new Set(candidates.map((v) => String(v.value)))];
    if (distinct.length === 1) values.push(candidates[0]); else if (distinct.length > 1) issues.push({ slug, candidates, reason: "Sources contradictoires" });
  }
  return { values, issues };
}
