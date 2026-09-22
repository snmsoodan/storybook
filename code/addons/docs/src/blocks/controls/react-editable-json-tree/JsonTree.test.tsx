// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import React from 'react';

import { ThemeProvider, convert, themes } from 'storybook/theming';

import { JsonTree } from './index.tsx';

afterEach(() => cleanup());

// The manager holds a marker where the preview had a function, see
// core/src/shared/args/serialized-functions.ts. Without it, the action in an object arg disappeared
// from the Controls panel, while the Docs page - which runs in the preview - still showed it.
describe('JsonTree', () => {
  it('renders the marker in an object arg as a function', () => {
    render(
      <ThemeProvider theme={convert(themes.light)}>
        <JsonTree
          rootName="args"
          data={{ link: { href: '/example', onClick: { __function__: { name: 'onClick' } } } }}
          onFullyUpdate={() => {}}
        />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'link :' }));

    expect(screen.queryByText('function onClick() {}')).not.toBeNull();
  });
});
