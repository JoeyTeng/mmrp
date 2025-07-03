export function camelizeKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    // Recurse into arrays
    return value.map((v) => camelizeKeys(v)) as unknown as T;
  }

  if (value !== null && typeof value === "object") {
    const out = {} as Record<string, unknown>;
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const camelKey = key.replace(/_([a-z])/g, (_match, grp) =>
        grp.toUpperCase(),
      );
      out[camelKey] = camelizeKeys(val);
    }
    return out as T;
  }

  // Primitives (string, number, etc.) pass through
  return value;
}
