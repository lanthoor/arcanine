import { invoke } from '@tauri-apps/api/core';

const STORAGE_KEY = 'arcanine-collections';

/**
 * Persisted collection data (only paths, not full collection data)
 */
type PersistedCollections = {
  collectionPaths: string[];
  activeIndex: number | null;
};

/**
 * Collection metadata structure matching Rust model
 */
export interface CollectionMetadata {
  version?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Collection structure matching Rust model
 */
export interface Collection {
  name: string;
  requests: Array<{
    name: string;
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
  }>;
  description?: string;
  metadata: CollectionMetadata;
  path?: string; // File path (frontend only)
}

/**
 * Save status for collections
 */
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

/**
 * Collection store state
 */
interface CollectionState {
  collections: Collection[];
  activeCollectionIndex: number | null;
  saveStatus: SaveStatus;
  error: string | null;
  isDirty: boolean;
}

/**
 * Collection store using Svelte 5 runes pattern
 */
class CollectionStore {
  private state = $state<CollectionState>({
    collections: [],
    activeCollectionIndex: null,
    saveStatus: 'saved',
    error: null,
    isDirty: false,
  });

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly AUTO_SAVE_DELAY = 2000; // 2 seconds
  private isInitialized = false;

  constructor() {
    // Initialize from localStorage when running in browser
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Load collection paths from localStorage and reload collections
   */
  private async loadFromStorage() {
    if (this.isInitialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: PersistedCollections = JSON.parse(stored);

        // Reload each collection from its path
        for (const path of data.collectionPaths) {
          try {
            await this.loadCollection(path);
          } catch (err) {
            // Silently skip collections that can't be loaded
            console.warn(`Failed to load collection from ${path}:`, err);
          }
        }

        // Restore active index
        if (data.activeIndex !== null && data.activeIndex < this.state.collections.length) {
          this.state.activeCollectionIndex = data.activeIndex;
        }
      }
    } catch (err) {
      console.error('Failed to load collections from storage:', err);
    } finally {
      this.isInitialized = true;
    }
  }

  /**
   * Save collection paths to localStorage
   */
  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const data: PersistedCollections = {
        collectionPaths: this.state.collections.filter((c) => c.path).map((c) => c.path!),
        activeIndex: this.state.activeCollectionIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save collections to storage:', err);
    }
  }

  /**
   * Get all loaded collections
   */
  get collections(): Collection[] {
    return this.state.collections;
  }

  /**
   * Get active collection
   */
  get activeCollection(): Collection | null {
    if (this.state.activeCollectionIndex === null) return null;
    return this.state.collections[this.state.activeCollectionIndex] ?? null;
  }

  /**
   * Get save status
   */
  get saveStatus(): SaveStatus {
    return this.state.saveStatus;
  }

  /**
   * Get error message
   */
  get error(): string | null {
    return this.state.error;
  }

  /**
   * Check if there are unsaved changes
   */
  get isDirty(): boolean {
    return this.state.isDirty;
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string, basePath: string): Promise<void> {
    try {
      this.state.error = null;
      this.state.saveStatus = 'saving';

      const result = await invoke<{ path: string; collection: Collection }>(
        'create_new_collection',
        {
          name,
          basePath,
        }
      );

      // Add to collections list
      const newCollection: Collection = {
        ...result.collection,
        path: result.path,
      };

      this.state.collections.push(newCollection);
      this.state.activeCollectionIndex = this.state.collections.length - 1;
      this.state.saveStatus = 'saved';
      this.state.isDirty = false;
      this.saveToStorage();
    } catch (error) {
      this.state.error = error as string;
      this.state.saveStatus = 'error';
      throw error;
    }
  }

  /**
   * Load a collection from file path
   */
  async loadCollection(path: string): Promise<void> {
    try {
      this.state.error = null;
      this.state.saveStatus = 'saving';

      // Load the collection metadata
      const collection = await invoke<Collection>('load_collection', { path });

      // Try to load requests from separate files (new format)
      // Fall back to embedded requests (old format) if loading fails
      try {
        const requests = await invoke<Collection['requests']>('load_requests_from_collection', {
          collectionPath: path,
        });

        // If we got separate request files and they exist, use them
        if (requests && requests.length > 0) {
          collection.requests = requests;
        }
        // Otherwise keep the embedded requests from collection.yaml
      } catch {
        // If loading separate files fails, keep the embedded requests
        console.log('[loadCollection] Using embedded requests (old format)');
      }

      // Check if already loaded
      const existingIndex = this.state.collections.findIndex((c) => c.path === path);
      if (existingIndex !== -1) {
        // Update existing collection
        this.state.collections[existingIndex] = { ...collection, path };
        this.state.activeCollectionIndex = existingIndex;
      } else {
        // Add new collection
        this.state.collections.push({ ...collection, path });
        this.state.activeCollectionIndex = this.state.collections.length - 1;
      }

      this.state.saveStatus = 'saved';
      this.state.isDirty = false;
      this.saveToStorage();
    } catch (error) {
      this.state.error = error as string;
      this.state.saveStatus = 'error';
      throw error;
    }
  }

  /**
   * Save the active collection
   */
  async saveCollection(): Promise<void> {
    console.log('[saveCollection] Starting...');
    const collection = this.activeCollection;
    if (!collection || !collection.path) {
      const error = 'No active collection or path not set';
      console.error('[saveCollection]', error);
      this.state.error = error;
      this.state.saveStatus = 'error';
      return;
    }

    console.log('[saveCollection] Collection:', collection.name);
    console.log('[saveCollection] Path:', collection.path);

    try {
      this.state.error = null;
      this.state.saveStatus = 'saving';

      // Extract filename from path
      // Two formats supported:
      // 1. New format: /base/path/folder-name/collection.yaml -> "folder-name"
      // 2. Old format: /base/path/name.collection.yaml -> "name"
      const normalizedPath = collection.path.replace(/\\/g, '/');
      const pathParts = normalizedPath.split('/').filter((p) => p);
      const lastPart = pathParts[pathParts.length - 1];

      console.log('[saveCollection] Normalized path:', normalizedPath);
      console.log('[saveCollection] Last part:', lastPart);

      let filename: string | undefined;

      if (lastPart === 'collection.yaml' && pathParts.length >= 2) {
        // New format: path ends with collection.yaml, get the folder before it
        filename = pathParts[pathParts.length - 2];
        console.log('[saveCollection] Using new format, filename:', filename);
      } else if (lastPart.endsWith('.collection.yaml')) {
        // Old format: flat file like "testing123.collection.yaml"
        filename = lastPart.replace('.collection.yaml', '');
        console.log('[saveCollection] Using old format, filename:', filename);
      } else if (normalizedPath.includes('/collection.yaml')) {
        // Path contains collection.yaml somewhere, extract folder before it
        const beforeYaml = normalizedPath.split('/collection.yaml')[0];
        const parts = beforeYaml.split('/').filter((p) => p);
        filename = parts[parts.length - 1];
        console.log('[saveCollection] Using middle format, filename:', filename);
      } else {
        // Fallback: use the last part without extension
        filename = lastPart.replace(/\.(yaml|yml)$/, '');
        console.log('[saveCollection] Using fallback format, filename:', filename);
      }

      if (!filename) {
        throw new Error(`Could not extract filename from collection path: ${collection.path}`);
      }

      console.log('[saveCollection] Final filename:', filename);
      console.log('[saveCollection] Requests to save:', collection.requests.length);

      await invoke('save_collection', {
        filename: filename,
        collection: {
          name: collection.name,
          requests: collection.requests,
          description: collection.description,
          metadata: collection.metadata,
        },
      });

      console.log('[saveCollection] Save successful');
      this.state.saveStatus = 'saved';
      this.state.isDirty = false;
    } catch (error) {
      console.error('[saveCollection] Error:', error);
      this.state.error = error as string;
      this.state.saveStatus = 'error';
      throw error;
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(path: string): Promise<void> {
    try {
      this.state.error = null;

      await invoke('delete_collection', { path });

      // Remove from collections list
      const index = this.state.collections.findIndex((c) => c.path === path);
      if (index !== -1) {
        this.state.collections.splice(index, 1);

        // Update active index if needed
        if (this.state.activeCollectionIndex === index) {
          this.state.activeCollectionIndex = this.state.collections.length > 0 ? 0 : null;
        } else if (
          this.state.activeCollectionIndex !== null &&
          this.state.activeCollectionIndex > index
        ) {
          this.state.activeCollectionIndex--;
        }

        this.saveToStorage();
      }
    } catch (error) {
      this.state.error = error as string;
      throw error;
    }
  }

  /**
   * List all available collections
   */
  async listCollections(): Promise<Collection[]> {
    try {
      this.state.error = null;
      const collections = await invoke<Collection[]>('list_collections');
      return collections;
    } catch (error) {
      this.state.error = error as string;
      throw error;
    }
  }

  /**
   * Validate a collection and optionally auto-fix issues
   */
  async validateCollection(path: string, autoFix = false): Promise<string[]> {
    try {
      this.state.error = null;
      const issues = await invoke<string[]>('validate_collection', {
        path,
        autoFix,
      });
      return issues;
    } catch (error) {
      this.state.error = error as string;
      throw error;
    }
  }

  /**
   * Set the active collection by index
   */
  setActiveCollection(index: number): void {
    if (index >= 0 && index < this.state.collections.length) {
      this.state.activeCollectionIndex = index;
      this.saveToStorage();
    }
  }

  /**
   * Add a new request to a collection
   */
  async addRequest(
    collectionIndex: number,
    request: {
      name: string;
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<void> {
    const collection = this.state.collections[collectionIndex];
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Set as active collection first
    this.state.activeCollectionIndex = collectionIndex;

    // Generate a unique filename for the request
    const timestamp = Date.now();
    const sanitizedName = request.name.toLowerCase().replace(/\s+/g, '-');
    const requestFileName = `${sanitizedName}-${timestamp}`;

    // Save the request as a separate file
    try {
      await invoke('save_request_to_collection', {
        collectionPath: collection.path,
        request: {
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers || {},
          body: request.body || '',
        },
        requestName: requestFileName,
      });

      // Add to the in-memory collection with filename metadata
      const requestWithMetadata = {
        ...request,
        _filename: requestFileName, // Store filename for later deletion/updates
      };
      collection.requests.push(requestWithMetadata);
    } catch (error) {
      console.error('Failed to save request:', error);
      throw error;
    }
  }

  /**
   * Update a request in a collection
   */
  async updateRequest(
    collectionIndex: number,
    requestIndex: number,
    request: {
      name: string;
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<void> {
    const collection = this.state.collections[collectionIndex];
    if (!collection || !collection.requests[requestIndex]) {
      throw new Error('Collection or request not found');
    }

    // Set as active collection first
    this.state.activeCollectionIndex = collectionIndex;

    const existingRequest = collection.requests[requestIndex] as typeof request & {
      _filename?: string;
    };

    // If the request has a filename, update the individual file
    if (existingRequest._filename) {
      try {
        await invoke('update_request_in_collection', {
          collectionPath: collection.path,
          request: {
            name: request.name,
            method: request.method,
            url: request.url,
            headers: request.headers || {},
            body: request.body || '',
          },
          requestName: existingRequest._filename,
        });

        // Update in-memory with filename preserved
        collection.requests[requestIndex] = {
          ...request,
          _filename: existingRequest._filename,
        };
      } catch (error) {
        console.error('Failed to update request file:', error);
        throw error;
      }
    } else {
      // Legacy: just update in memory (shouldn't happen with new format)
      collection.requests[requestIndex] = request;
    }
  }

  /**
   * Delete a request from a collection
   */
  async deleteRequest(collectionIndex: number, requestIndex: number): Promise<void> {
    const collection = this.state.collections[collectionIndex];
    if (!collection || !collection.requests[requestIndex]) {
      throw new Error('Collection or request not found');
    }

    // Set as active collection first
    this.state.activeCollectionIndex = collectionIndex;

    const request = collection.requests[requestIndex] as { _filename?: string };

    // Delete the request file if it has a filename
    if (request._filename) {
      try {
        await invoke('delete_request_from_collection', {
          collectionPath: collection.path,
          requestName: request._filename,
        });
      } catch (error) {
        console.error('Failed to delete request file:', error);
        // Continue with in-memory deletion even if file deletion fails
      }
    }

    // Remove from in-memory collection
    collection.requests.splice(requestIndex, 1);
  }

  /**
   * Mark collection as modified (triggers auto-save)
   */
  markDirty(): void {
    this.state.isDirty = true;
    this.state.saveStatus = 'unsaved';
    this.scheduleAutoSave();
  }

  /**
   * Schedule auto-save with debounce
   */
  private scheduleAutoSave(): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    this.saveTimeout = setTimeout(async () => {
      if (this.state.isDirty && this.activeCollection) {
        try {
          await this.saveCollection();
        } catch (error) {
          console.error('Auto-save failed:', error);
          // Error already set in saveCollection
        }
      }
    }, this.AUTO_SAVE_DELAY);
  }

  /**
   * Cancel pending auto-save
   */
  cancelAutoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Update active collection data
   */
  updateActiveCollection(updates: Partial<Collection>): void {
    if (this.state.activeCollectionIndex !== null) {
      const collection = this.state.collections[this.state.activeCollectionIndex];
      if (collection) {
        Object.assign(collection, updates);
        this.markDirty();
      }
    }
  }

  /**
   * Close a collection (with unsaved changes warning handled by UI)
   */
  closeCollection(index: number): void {
    if (index >= 0 && index < this.state.collections.length) {
      this.state.collections.splice(index, 1);

      // Update active index
      if (this.state.activeCollectionIndex === index) {
        this.state.activeCollectionIndex = this.state.collections.length > 0 ? 0 : null;
        this.state.isDirty = false;
        this.state.saveStatus = 'saved';
      } else if (
        this.state.activeCollectionIndex !== null &&
        this.state.activeCollectionIndex > index
      ) {
        this.state.activeCollectionIndex--;
      }

      this.saveToStorage();
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null;
  }
}

export const collectionStore = new CollectionStore();
