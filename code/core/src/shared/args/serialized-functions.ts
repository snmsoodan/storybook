/**
 * Args can hold functions, e.g. an `action` nested in an object arg. Functions cannot be sent over
 * the channel - its serializer drops them - so the manager received args without them and the
 * Controls panel did not show the action, while the Docs page (which runs in the preview, where the
 * function is still present) did.
 *
 * To keep them visible, functions are replaced by the marker below just before an args payload is
 * sent to the manager. The JSON tree of the Controls panel renders the marker as a function again.
 * This is the same marker shape the instrumenter uses for the arguments of interaction calls.
 */
export interface SerializedFunction {
  __function__: { name: string };
}

export function isSerializedFunction(value: unknown): value is SerializedFunction {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { __function__: fn } = value as Partial<SerializedFunction>;
  return typeof fn?.name === 'string';
}

/**
 * Replace every function in a value with a marker, so that it survives being sent to the manager.
 * Values without functions are returned as is, nothing is mutated.
 */
export function serializeFunctions<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (typeof value === 'function') {
    return { __function__: { name: value.name } } as unknown as T;
  }
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return value;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => serializeFunctions(item, seen)) as unknown as T;
  }
  // Other objects (class instances, Map, Set, Date, ...) are converted for the channel already and
  // are not edited as a JSON tree in the Controls panel, so they are left untouched.
  if (value.constructor !== Object) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, serializeFunctions(item, seen)])
  ) as T;
}

/**
 * Args received from the manager hold a marker where the preview had a function. The manager sends
 * args back whenever a nested value of an object arg is edited, so the markers have to be replaced
 * by the functions that are still in the preview, otherwise an action is lost as soon as another
 * property of the object that contains it is changed.
 */
export function deserializeFunctions<T>(value: T, original?: unknown): T {
  if (isSerializedFunction(value)) {
    return (typeof original === 'function' ? original : value) as unknown as T;
  }
  if (typeof value !== 'object' || value === null || typeof original !== 'object' || !original) {
    return value;
  }
  if (Array.isArray(value)) {
    const originalArray = Array.isArray(original) ? original : [];
    return value.map((item, index) =>
      deserializeFunctions(item, originalArray[index])
    ) as unknown as T;
  }
  if (value.constructor !== Object) {
    return value;
  }
  const originalObject = original as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      deserializeFunctions(item, originalObject[key]),
    ])
  ) as T;
}
