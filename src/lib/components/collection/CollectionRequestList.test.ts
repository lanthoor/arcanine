import { describe, it, expect } from 'vitest';
import CollectionRequestList from './CollectionRequestList.svelte';

describe('CollectionRequestList', () => {
  it('exports component correctly', () => {
    expect(CollectionRequestList).toBeDefined();
    expect(typeof CollectionRequestList).toBe('function');
  });

  it('component has expected structure', () => {
    expect(CollectionRequestList.name).toBeTruthy();
  });
});
