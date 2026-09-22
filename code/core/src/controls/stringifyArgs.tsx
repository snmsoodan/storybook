import { isSerializedFunction } from '../shared/args/serialized-functions.ts';

export const stringifyArgs = (args: Record<string, any>) =>
  JSON.stringify(args, (_, value) => {
    // Args in the manager hold a marker where the preview had a function, see
    // shared/args/serialized-functions.ts.
    if (typeof value === 'function' || isSerializedFunction(value)) {
      return '__sb_empty_function_arg__';
    }
    return value;
  });
