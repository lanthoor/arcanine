import { describe, it, expect } from 'vitest';
import NewCollectionDialog from './NewCollectionDialog.svelte';

describe('NewCollectionDialog', () => {
  it('exports component correctly', () => {
    expect(NewCollectionDialog).toBeDefined();
    expect(typeof NewCollectionDialog).toBe('function');
  });

  it('component has expected structure', () => {
    expect(NewCollectionDialog.name).toBeTruthy();
  });
});
