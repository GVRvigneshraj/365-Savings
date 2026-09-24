export function createId(prefix = 'id'): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

/** Lightweight non-reversible password digest for local-only demo auth. */
export function hashPassword(password: string): string {
  const input = `365-savings::${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ code, 2246822519) >>> 0;
  }
  let h3 = Math.imul(h1 ^ (h2 >>> 7), 2654435761) >>> 0;
  return [h1, h2, h3]
    .map((part) => part.toString(16).padStart(8, '0'))
    .join('');
}
