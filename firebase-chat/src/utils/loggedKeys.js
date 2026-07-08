const SPECIAL_KEYS = new Set(['Backspace', 'Delete', 'Enter'])

/** Return the key label to log, or null for non-logged keys (modifiers, arrows, etc.). */
export function normalizeLoggedKey(key) {
  if (SPECIAL_KEYS.has(key)) return key
  if (key.length === 1) return key
  return null
}
