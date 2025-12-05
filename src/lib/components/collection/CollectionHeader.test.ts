import { describe, it, expect } from 'vitest';
import CollectionHeader from './CollectionHeader.svelte';

describe('CollectionHeader', () => {
  it('exports component correctly', () => {
    expect(CollectionHeader).toBeDefined();
    expect(typeof CollectionHeader).toBe('function');
  });

  it('component has expected structure', () => {
    expect(CollectionHeader.name).toBeTruthy();
  });
});
