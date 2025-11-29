import { render, type RenderResult } from '@testing-library/svelte';
import type { SvelteComponent } from 'svelte';

/**
 * Renders a Svelte component with common test setup
 */
export function renderWithDefaults<T extends SvelteComponent>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any,
  options?: Parameters<typeof render>[1]
): RenderResult<T> {
  return render(component, options);
}

/**
 * Waits for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mocks localStorage for tests
 */
export class LocalStorageMock {
  private store: Record<string, string> = {};

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

/**
 * Creates a mock localStorage instance
 */
export function createLocalStorageMock(): Storage {
  const mock = new LocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  });
  return mock as unknown as Storage;
}

/**
 * Asserts that an element has specific CSS classes
 */
export function expectToHaveClasses(element: HTMLElement, ...classNames: string[]): void {
  classNames.forEach((className) => {
    if (!element.classList.contains(className)) {
      throw new Error(
        `Expected element to have class "${className}", but it has: ${Array.from(element.classList).join(', ')}`
      );
    }
  });
}

/**
 * Asserts that an element does not have specific CSS classes
 */
export function expectNotToHaveClasses(element: HTMLElement, ...classNames: string[]): void {
  classNames.forEach((className) => {
    if (element.classList.contains(className)) {
      throw new Error(`Expected element not to have class "${className}", but it does`);
    }
  });
}
