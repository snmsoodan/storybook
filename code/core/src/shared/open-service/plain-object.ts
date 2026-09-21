import { OpenServiceCyclicStateError } from '../../server-errors.ts';

// Own keys that must never be copied or assigned, to block prototype pollution.
export const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Deep-copies a JSON-shaped value, giving every path its own object.
 *
 * Used for every value on its way into service state: a definition's `initialState`, an object
 * assigned inside a `setState` recipe, and the value carried by a recorded op.
 *
 * Not `structuredClone`. That keeps a reference shared between two keys as one object, so a write
 * through one key would also change the other on the writing runtime, while peers, who only ever
 * receive JSON, would see one path change. Rebuilding key by key removes the alias on both sides.
 * It also accepts proxies and drops the prototype-pollution keys in {@link FORBIDDEN_KEYS}. A
 * cyclic value throws {@link OpenServiceCyclicStateError}, since it could never be serialized for
 * peers. An `undefined` property is dropped, as JSON drops it, so the author and peers agree on
 * which keys exist.
 *
 * Only own enumerable string keys are copied. Class instances, `Map`, `Set`, and `Date` become plain
 * objects, which matches the JSON-serializable contract service state already has.
 */
export function clonePlain(value: unknown, ancestors: readonly object[] = []): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (ancestors.includes(value)) {
    throw new OpenServiceCyclicStateError();
  }
  const path = [...ancestors, value];
  if (Array.isArray(value)) {
    return value.map((entry) => clonePlain(entry, path));
  }
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const entry = (value as Record<string, unknown>)[key];
    if (FORBIDDEN_KEYS.has(key) || entry === undefined) {
      continue;
    }
    copy[key] = clonePlain(entry, path);
  }
  return copy;
}
