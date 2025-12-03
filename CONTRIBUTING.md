# Contributing to Arcanine

First off, thank you for considering contributing to Arcanine! It's people like you that make Arcanine such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to support@arcanine.dev.

### Our Pledge

We pledge to make participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of behavior that contributes to creating a positive environment include:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior include:**

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Issues

- **Bug Reports**: If you find a bug, please create an issue with the `bug` label
- **Feature Requests**: Have an idea? Create an issue with the `enhancement` label
- **Questions**: Use the `question` label or start a discussion

Before creating an issue:

1. Check if the issue already exists
2. Use the issue templates provided
3. Provide as much context as possible

### Good First Issues

Look for issues labeled `good first issue` - these are great for newcomers!

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. macOS 13.0, Windows 11, Ubuntu 22.04]
- Arcanine Version: [e.g. 1.0.0]
- Collection Schema Version: [e.g. 1.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

**Enhancement Template:**

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Your First Code Contribution

Unsure where to begin? Start by looking through `good first issue` and `help wanted` issues:

- **Good First Issues** - issues which should only require a few lines of code
- **Help Wanted Issues** - issues which may be more involved

## Development Setup

### Prerequisites

- **Rust** 1.70 or higher - [Install Rust](https://rustup.rs/)
- **Node.js** 18 or higher - [Install Node.js](https://nodejs.org/)
- **Git** - [Install Git](https://git-scm.com/)

**Note**: Deno will be added in Phase 11 for scripting support.

### Setup Steps

1. **Fork the repository**

   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/arcanine.git
   cd arcanine
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/lanthoor/arcanine.git
   ```

4. **Install dependencies**

   ```bash
   # Install Node.js dependencies
   npm install

   # Rust dependencies are managed by Cargo (no separate install needed)
   ```

5. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

### Development Commands

```bash
# Run frontend in development mode
npm run dev

# Run Tauri application in development mode
npm run tauri dev

# Build frontend for production
npm run build

# Build Tauri application for production
npm run tauri build

# Type checking
npm run check
npm run check:watch  # Watch mode

# Lint frontend code
npm run lint
npm run lint:fix  # Auto-fix issues

# Format frontend code
npm run format
npm run format:check  # Check only

# Format Rust code
cd src-tauri && cargo fmt

# Run Rust linter
cd src-tauri && cargo clippy

# Run tests
npm run test              # Frontend tests (watch mode)
npm run test:run          # Frontend tests (single run)
npm run test:coverage     # Frontend coverage
npm run test:rust         # Backend tests
npm run test:rust:coverage # Backend coverage
```

## Coding Standards

### Frontend (TypeScript/Svelte)

- **Style Guide**: Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Formatting**: Use Prettier (configured in `.prettierrc`)
  - 2-space indentation
  - Single quotes
  - Trailing commas
  - Svelte plugin enabled
- **Linting**: Use ESLint (configured in `eslint.config.js`)
  - TypeScript ESLint parser
  - Svelte plugin enabled
- **TypeScript**: Strict mode enabled (`strict: true`)
- **Styling**: TailwindCSS v4 with `@tailwindcss/postcss` plugin

**Example:**

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): User | null {
  // Implementation
}

// Bad
interface user {
  id: string;
  name: string;
  email: string;
}

function get_user_by_id(id: string) {
  // Implementation
}
```

### Backend (Rust)

- **Style Guide**: Follow the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- **Formatting**: Use `rustfmt` (run `cargo fmt`)
  - Edition 2021
  - Max line width: 100 characters
  - Configured in `src-tauri/rustfmt.toml`
- **Linting**: Use `clippy` (run `cargo clippy`)

**Example:**

```rust
// Good
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}

impl User {
    pub fn new(id: String, name: String, email: String) -> Self {
        Self { id, name, email }
    }
}

// Bad
pub struct user {
    pub ID: String,
    pub Name: String,
    pub Email: String,
}
```

### General Principles

1. **DRY (Don't Repeat Yourself)**: Avoid code duplication
2. **SOLID Principles**: Follow object-oriented design principles
3. **KISS (Keep It Simple, Stupid)**: Prefer simple solutions
4. **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until needed
5. **Comments**: Write self-documenting code, use comments for "why" not "what"

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```bash
# Feature
feat(request): add support for WebSocket connections

# Bug fix
fix(auth): resolve OAuth2 token refresh issue

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(storage): improve YAML parsing performance

# Breaking change
feat(api)!: change variable resolution order

BREAKING CHANGE: Variable resolution now prioritizes environment variables over collection variables.
```

### Commit Message Rules

1. Use the imperative mood ("add" not "added" or "adds")
2. Don't capitalize the first letter
3. No period (.) at the end
4. Limit the subject line to 50 characters
5. Wrap the body at 72 characters
6. Use the body to explain what and why, not how

## Pull Request Process

### Before Submitting

1. **Update your fork**

   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clear, concise code
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**

   ```bash
   npm test
   cd src-tauri && cargo test
   ```

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat(scope): add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

### Submitting the Pull Request

1. Go to the [Arcanine repository](https://github.com/lanthoor/arcanine)
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks**: CI/CD will run tests and linting
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

### After Your PR is Merged

1. Delete your feature branch

   ```bash
   git branch -d feature/amazing-feature
   git push origin --delete feature/amazing-feature
   ```

2. Update your local main branch
   ```bash
   git checkout main
   git pull upstream main
   ```

## Testing

### Frontend Testing

**Stack**: Vitest with Happy-DOM, @testing-library/svelte, @vitest/coverage-v8

**Commands**:

```bash
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage
```

**Coverage Goals**: 90%+ across lines, functions, branches, statements

**Test Structure**: Co-located with source files (`.test.ts` extension)

**Example**:

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

### Backend Testing

**Stack**: Rust built-in test framework, Tarpaulin for coverage

**Commands**:

```bash
cd src-tauri && cargo test              # Run tests
cd src-tauri && cargo test -- --nocapture  # With output
npm run test:rust:coverage              # With coverage
```

**Coverage Goals**: 90%+ backend coverage

**Test Structure**: Tests in same file using `#[cfg(test)]`

**Example**:

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

### Pre-commit Validation

All changes must pass before committing:

```bash
# Frontend
npm run lint              # ESLint check
npm run check             # TypeScript/Svelte check
npm run test:coverage     # Tests with coverage (≥90% lines, ≥80% branches)

# Backend
cd src-tauri && cargo fmt --check  # Rust formatting
cd src-tauri && cargo clippy -- -D warnings  # Rust linting
npm run test:rust:coverage  # Rust tests with coverage (≥90%)

# Build
npm run build  # Production build
```

### CI/CD Pipeline

Tests run automatically on push/PR:

- Frontend: Type checking, ESLint, Vitest with coverage
- Backend: `cargo fmt`, `cargo clippy`, unit tests, coverage (Ubuntu only)
- Build: Full application build on Ubuntu, macOS, Windows

See `.github/workflows/ci.yml` for details.

## Additional Resources

- **Setup Guide**: See [SETUP.md](SETUP.md) for development environment prerequisites and installation
- **Architecture**: See [docs/architecture/README.md](docs/architecture/README.md) for technical design and project structure
- **Progress**: See [docs/progress/README.md](docs/progress/README.md) for current project status
- **Roadmap**: See [docs/plan/](docs/plan/) for project vision and execution plan

## Recognition

Contributors are recognized in:

- GitHub contributors page
- Release notes
- README acknowledgments

## Questions?

- 💬 Start a [Discussion](https://github.com/lanthoor/arcanine/discussions)
- 📧 Email: support@arcanine.dev
- 🐛 Report issues on [GitHub](https://github.com/lanthoor/arcanine/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Arcanine! 🎉**

Your efforts help make Arcanine better for everyone.
