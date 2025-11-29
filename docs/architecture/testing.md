# Testing Documentation

## Overview

Arcanine uses a comprehensive testing strategy targeting 90%+ code coverage across all components.

## Frontend Testing

### Stack

- **Framework**: Vitest
- **Environment**: Happy-DOM (for better Svelte 5 compatibility)
- **Testing Library**: @testing-library/svelte
- **Coverage**: @vitest/coverage-v8

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with their source files using the `.test.ts` extension:

```
src/lib/
├── components/
│   ├── ThemeToggle.svelte
│   └── ThemeToggle.test.ts
├── stores/
│   ├── theme.ts
│   └── theme.test.ts
└── i18n/
    ├── index.ts
    └── index.test.ts
```

### Writing Frontend Tests

#### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from 'svelte';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('renders correctly', () => {
    expect(MyComponent).toBeDefined();
  });
});
```

#### Store Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { myStore, updateStore } from './myStore';

describe('myStore', () => {
  beforeEach(() => {
    // Reset store state
    myStore.set(initialValue);
  });

  it('updates correctly', () => {
    updateStore(newValue);
    expect(get(myStore)).toBe(newValue);
  });
});
```

#### Utility Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from './utils';

describe('myUtility', () => {
  it('performs calculation correctly', () => {
    const result = myUtility(input);
    expect(result).toBe(expected);
  });
});
```

### Test Utilities

Common test utilities are available in `src/test/utils.ts`:

- `renderWithDefaults()`: Render Svelte components with common setup
- `wait()`: Wait for async operations
- `LocalStorageMock`: Mock localStorage
- `createLocalStorageMock()`: Create mock localStorage instance
- `expectToHaveClasses()`: Assert element has CSS classes
- `expectNotToHaveClasses()`: Assert element doesn't have CSS classes

## Backend Testing

### Stack

- **Framework**: Rust built-in test framework
- **Coverage**: Tarpaulin (to be configured)

### Running Tests

```bash
# Run all Rust tests
cd src-tauri && cargo test

# Run specific test
cargo test test_name

# Run tests with output
cargo test -- --nocapture

# Run tests with coverage (when tarpaulin is set up)
cargo tarpaulin --out Html
```

### Test Structure

Tests are included in the same file as the code using the `#[cfg(test)]` attribute:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function() {
        let result = my_function();
        assert_eq!(result, expected_value);
    }
}
```

### Writing Backend Tests

#### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_request_creation() {
        let request = Request::new("GET", "https://api.example.com");
        assert_eq!(request.method, "GET");
        assert_eq!(request.url, "https://api.example.com");
    }

    #[test]
    fn test_validation() {
        let request = Request::new("INVALID", "not-a-url");
        assert!(request.validate().is_err());
    }
}
```

#### Integration Tests

Integration tests go in `src-tauri/tests/`:

```rust
// src-tauri/tests/integration_test.rs
use arcanine_lib::*;

#[test]
fn test_full_workflow() {
    // Test complete workflow
}
```

## CI/CD Testing

### GitHub Actions

Tests run automatically on:

- Push to `main` branch
- Pull requests to `main`

The CI pipeline runs:

1. **Frontend Tests** (Ubuntu):
   - Type checking
   - ESLint linting
   - Vitest tests with coverage
   - Upload coverage to Codecov

2. **Backend Tests** (Ubuntu, macOS, Windows):
   - Rust formatting check (`cargo fmt`)
   - Clippy linting (`cargo clippy`)
   - Unit tests (`cargo test`)
   - Coverage generation (Ubuntu only, using cargo-tarpaulin)
   - Upload coverage to Codecov (Ubuntu only)

3. **Build** (Ubuntu, macOS, Windows):
   - Full application build after tests pass

See `.github/workflows/ci.yml` for details.

## Pre-commit Hooks

Husky runs `lint-staged` before each commit, which:

- Runs ESLint with auto-fix on TypeScript/Svelte files
- Runs Prettier on TypeScript/Svelte/JSON/CSS/Markdown
- Runs `cargo fmt` on Rust files

## Coverage Goals

- **Target**: 90%+ coverage across all code
- **Current**: Building up as features are implemented
- **Thresholds**:
  - Lines: 90%
  - Functions: 90%
  - Branches: 90%
  - Statements: 90%

### Viewing Coverage

**Frontend**: After running `npm run test:coverage`, open `coverage/index.html` in your browser.

**Backend**: After running `npm run test:rust:coverage`, open `coverage-rust/index.html` in your browser.

## Best Practices

### Frontend

1. Test user-facing behavior, not implementation details
2. Use `data-testid` sparingly, prefer accessible queries
3. Mock external dependencies (API calls, localStorage, etc.)
4. Test edge cases and error states
5. Keep tests fast and isolated

### Backend

1. Test public APIs thoroughly
2. Use fixtures for test data
3. Test error handling extensively
4. Test with realistic data sizes
5. Benchmark performance-critical code

### General

1. Write tests alongside code (TDD encouraged)
2. Keep test names descriptive
3. One assertion per test when possible
4. Use `beforeEach` for setup, avoid global state
5. Comment complex test scenarios

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "lifecycle_function_unavailable"
**Solution**: Use `happy-dom` environment and ensure runes mode is enabled

**Issue**: localStorage not persisting in tests
**Solution**: Use `createLocalStorageMock()` or test localStorage interactions directly

**Issue**: Svelte 5 component tests fail
**Solution**: Ensure `compilerOptions: { runes: true }` in vitest.config.ts

**Issue**: Tests are slow
**Solution**: Use `vi.mock()` for heavy dependencies, avoid unnecessary DOM operations

## Future Enhancements

- [ ] E2E testing with Playwright (Phase 18)
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Accessibility testing automation
- [ ] Contract testing for file formats
