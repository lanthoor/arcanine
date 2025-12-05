import { describe, it, expect } from 'vitest';
import CollectionMenu from './CollectionMenu.svelte';

describe('CollectionMenu', () => {
  it('exports component correctly', () => {
    expect(CollectionMenu).toBeDefined();
    expect(typeof CollectionMenu).toBe('function');
  });

  it('component has expected structure', () => {
    expect(CollectionMenu.name).toBeTruthy();
  });
});
