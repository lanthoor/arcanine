import { describe, it, expect } from 'vitest';
import CollectionTabs from './CollectionTabs.svelte';

describe('CollectionTabs', () => {
  it('exports component correctly', () => {
    expect(CollectionTabs).toBeDefined();
    expect(typeof CollectionTabs).toBe('function');
  });

  it('component has expected structure', () => {
    expect(CollectionTabs.name).toBeTruthy();
  });
});
