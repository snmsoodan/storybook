import { describe, expect, it } from 'vitest';

import { stringifyArgs } from './stringifyArgs.tsx';

describe('stringifyArgs', () => {
  it('serializes args without functions', () => {
    expect(stringifyArgs({ foo: 'a', one: 1 })).toBe('{"foo":"a","one":1}');
  });

  it('serializes a function as an empty function', () => {
    expect(stringifyArgs({ onClick: () => {} })).toBe('{"onClick":"__sb_empty_function_arg__"}');
  });

  // The manager only holds a marker where the preview holds a function, see
  // shared/args/serialized-functions.ts. Saving a story must not write the marker into the CSF
  // file, `parseArgs` in core-server/utils/save-story/save-story.ts turns the empty function back
  // into a function.
  it('serializes a marker as an empty function', () => {
    expect(
      stringifyArgs({ link: { href: '/example', onClick: { __function__: { name: 'onClick' } } } })
    ).toBe('{"link":{"href":"/example","onClick":"__sb_empty_function_arg__"}}');
  });
});
