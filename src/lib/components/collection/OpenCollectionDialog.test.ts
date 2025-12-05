import { describe, it, expect } from 'vitest';
import OpenCollectionDialog from './OpenCollectionDialog.svelte';

describe('OpenCollectionDialog', () => {
  it('exports component correctly', () => {
    expect(OpenCollectionDialog).toBeDefined();
    expect(typeof OpenCollectionDialog).toBe('function');
  });

  it('component has expected structure', () => {
    expect(OpenCollectionDialog.name).toBeTruthy();
  });
});
