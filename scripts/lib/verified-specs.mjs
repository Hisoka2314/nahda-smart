export function validateEvidence(fact) {
  if (!fact || typeof fact !== 'object' || fact.status !== 'verified') return false;
  if (!['string', 'number', 'boolean'].includes(typeof fact.value)) return false;
  if (typeof fact.value === 'number' && !Number.isFinite(fact.value)) return false;
  if (!fact.checkedAt || !fact.scope || !Array.isArray(fact.evidence)) return false;
  const urls = new Set();
  for (const source of fact.evidence) {
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || !source.proof?.trim()) return false;
      urls.add(url.href);
    } catch { return false; }
  }
  return urls.size >= 2;
}
export function encodeValue(attribute, options, value) {
  if (attribute.type === 'BOOLEAN') return typeof value === 'boolean' ? { valueBoolean: value } : null;
  if (['RANGE', 'NUMERIC_RANGE'].includes(attribute.type)) return typeof value === 'number' && Number.isFinite(value) ? { valueNumber: value } : null;
  const normalize = v => String(v).normalize('NFKC').trim().toLowerCase();
  const matches = options.filter(o => o.visible && [o.value, o.label].some(v => normalize(v) === normalize(value)));
  return matches.length === 1 ? { optionId: matches[0].id } : null;
}
export function sameValue(old, encoded) {
  return old.length === 1 && ['optionId', 'valueString', 'valueNumber', 'valueBoolean'].every(key => {
    const a = old[0][key] ?? null, b = encoded[key] ?? null;
    return key === 'valueNumber' && a !== null && b !== null ? Number(a) === b : a === b;
  });
}
