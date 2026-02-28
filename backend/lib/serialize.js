/**
 * Recursively convert object keys from camelCase to snake_case for API responses.
 */
function toSnake(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function snakeKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeKeys);
  if (typeof obj === "object" && obj.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = /[A-Z]/.test(k) ? toSnake(k) : k;
      out[key] = snakeKeys(v);
    }
    return out;
  }
  return obj;
}
