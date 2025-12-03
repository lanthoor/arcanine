# Arcanine - Project Structure

This document describes the project structure and key files for developers.

**Last Updated**: December 3, 2025  
**Current Version**: 0.4.2  
**Status**: Phase 4.2 Complete ✅

## Directory Structure

```
arcanine/
├── src/                          # Frontend (Svelte)
│   ├── lib/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ThemeToggle.svelte
│   │   │   ├── LanguageSwitcher.svelte
│   │   │   ├── RequestList.svelte
│   │   │   ├── RequestEditor.svelte
│   │   │   ├── ResponseViewer.svelte
│   │   │   ├── TabBar.svelte
│   │   │   ├── BottomToolbar.svelte
│   │   │   └── PreferencesPane.svelte
│   │   ├── i18n/                # Internationalization
│   │   │   ├── index.ts         # i18n store and utilities
│   │   │   └── locales/         # Translation files (5 languages)
│   │   │       ├── en.json      # English (base)
│   │   │       ├── es.json      # Spanish
│   │   │       ├── fr.json      # French
│   │   │       ├── de.json      # German
│   │   │       └── ja.json      # Japanese
│   │   └── stores/              # Svelte stores
│   │       ├── theme.ts         # Theme management
│   │       ├── ui.ts            # UI preferences (sidebar, layout)
│   │       ├── tabs.ts          # Tab management
│   │       └── responses.ts     # Response caching
│   ├── routes/                  # SvelteKit routes
│   │   ├── +layout.svelte       # Root layout with theme/i18n init
│   │   ├── +layout.ts           # Layout config
│   │   └── +page.svelte         # Main application UI
│   ├── test/                    # Frontend tests
│   │   ├── setup.ts             # Test setup
│   │   └── utils.ts             # Test utilities
│   ├── app.css                  # Global styles with CSS variables
│   └── app.html                 # HTML template
│
├── src-tauri/                   # Backend (Rust)
│   ├── src/                     # Rust source code
│   │   ├── lib.rs               # Library exports
│   │   ├── main.rs              # Application entry point
│   │   ├── models/              # Data models
│   │   │   ├── mod.rs           # Module exports
│   │   │   ├── error.rs         # Error types
│   │   │   ├── request.rs       # Request model
│   │   │   ├── response.rs      # Response model
│   │   │   └── collection.rs    # Collection model
│   │   ├── services/            # Business logic
│   │   │   ├── mod.rs           # Module exports
│   │   │   └── http.rs          # HTTP client service
│   │   ├── storage/             # Persistence layer
│   │   │   ├── mod.rs           # Module exports
│   │   │   ├── request_store.rs # In-memory storage
│   │   │   ├── yaml_store.rs    # File I/O operations
│   │   │   └── collection_manager.rs # Collection file system
│   │   └── commands/            # Tauri commands
│   │       ├── mod.rs           # Module exports
│   │       └── requests.rs      # Request commands
│   ├── capabilities/            # Tauri capabilities
│   ├── icons/                   # App icons
│   ├── Cargo.toml               # Rust dependencies
│   ├── rustfmt.toml             # Rust formatting config
│   └── tauri.conf.json          # Tauri configuration
│
├── docs/                        # Documentation
│   ├── architecture/            # Architecture documentation
│   │   ├── README.md            # Architecture overview
│   │   ├── data-models.md       # Model documentation
│   │   ├── theming.md           # Theme system guide
│   │   ├── i18n.md              # i18n documentation
│   │   └── yaml-schema.md       # YAML file format
│   ├── plan/                    # Development plan
│   │   └── README.md            # Complete roadmap
│   └── progress/                # Progress reports
│       ├── summary.md           # Overall progress
│       ├── phase-1.1-completion.md
│       ├── phase-1.2-completion.md
│       ├── phase-1.3-completion.md
│       ├── phase-2.1-completion.md
│       ├── phase-2.2-completion.md
│       ├── phase-2.3-completion.md
│       ├── phase-3.1-completion.md
│       ├── phase-3.2-completion.md
│       ├── phase-3.3-completion.md
│       ├── phase-3.4-completion.md
│       ├── phase-3.5-completion.md
│       ├── phase-3.6-completion.md
│       ├── phase-3.7-completion.md
│       ├── phase-4.1-completion.md
│       └── phase-4.2-completion.md
│
├── coverage/                    # Frontend test coverage
├── coverage-rust/               # Backend test coverage
├── .github/                     # GitHub configuration
│   └── workflows/               # CI/CD workflows
│       └── ci.yml               # Main CI pipeline
├── .eslintrc.cjs                # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── tailwind.config.js           # TailwindCSS configuration
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── svelte.config.js             # Svelte configuration
├── vite.config.js               # Vite configuration
├── vitest.config.ts             # Vitest configuration
├── package.json                 # Node.js dependencies
├── CONTRIBUTING.md              # Contribution guide
└── README.md                    # Main README
```

## Key Technologies

### Frontend

- **Svelte 5**: Reactive UI framework with runes API
- **SvelteKit**: Application framework with static adapter
- **TypeScript**: Type-safe JavaScript (strict mode enabled)
- **TailwindCSS v4**: Utility-first CSS framework
- **Vite**: Build tool and dev server
- **Vitest**: Testing framework with 95.88% coverage
- **svelte-i18n**: Internationalization library

### Backend

- **Tauri 2.x**: Desktop application framework
- **Rust**: Systems programming language
- **reqwest**: HTTP client with connection pooling
- **tokio**: Async runtime
- **serde**: Serialization framework
- **serde_yaml**: YAML support
- **notify**: File system watching
- **chrono**: Date and time handling

### Development Tools

- **Prettier**: Code formatter
- **ESLint**: JavaScript/TypeScript linter
- **rustfmt**: Rust code formatter
- **clippy**: Rust linter
- **cargo-tarpaulin**: Rust coverage (90.91%)
- **husky**: Git hooks
- **lint-staged**: Pre-commit validation

## Theme System

The theme system uses CSS custom properties (variables) defined in `src/app.css`:

### Light Theme

- Background: `#ffffff`
- Surface: `#f5f5f5`
- Primary: `#2563eb`
- Text: `#1e293b`

### Dark Theme

- Background: `#0f172a`
- Surface: `#1e293b`
- Primary: `#3b82f6`
- Text: `#f1f5f9`

Theme preference is persisted to `localStorage` and respects system preferences.

## Internationalization (i18n)

The i18n system supports 5 languages with 525+ translation keys:

- **Languages**: English (en), Spanish (es), French (fr), German (de), Japanese (ja)
- **Translation files**: JSON files in `src/lib/i18n/locales/`
- **Store**: Svelte store for reactive translations
- **Persistence**: Locale preference saved to localStorage
- **Fallback**: English as default language
- **Utilities**: Number, date, relative time, file size, pluralization formatters

### Adding Translations

1. Create a new JSON file in `src/lib/i18n/locales/` (e.g., `es.json`)
2. Copy the structure from `en.json`
3. Translate the values
4. The app will automatically detect and load the new locale

### Using Translations

```svelte
<script>
  import { _ } from 'svelte-i18n';
</script>

<h1>{$_('common.appName')}</h1><p>{$_('requestList.emptyState')}</p>
```

## Available Scripts

### Development

```bash
npm run dev              # Start dev server with hot reload
npm run tauri dev        # Start Tauri app in dev mode
```

### Building

```bash
npm run build            # Build for production
npm run tauri build      # Build Tauri app for production
npm run preview          # Preview production build
```

### Testing

```bash
npm run test             # Run frontend tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Frontend coverage (≥75%)
npm run test:rust        # Run Rust tests
npm run test:rust:coverage # Rust coverage (≥80%)
npm run test:rust:nextest  # Run Rust tests with nextest
```

### Code Quality

```bash
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run lint             # Lint code with ESLint
npm run lint:fix         # Fix linting issues
npm run check            # Type-check with svelte-check
npm run clippy           # Run Rust clippy
npm run clippy:fix       # Fix clippy issues
```

### Rust (from src-tauri/)

```bash
cargo fmt                # Format Rust code
cargo fmt --check        # Check Rust formatting
cargo clippy -- -D warnings  # Lint Rust code (fail on warnings)
cargo test               # Run Rust tests
cargo tarpaulin          # Generate coverage report
```

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run tauri dev
   ```

3. **The app features**:
   - Theme toggle (light/dark mode)
   - Language switcher (5 languages)
   - Request list with HTTP method badges
   - Request editor with form validation
   - Response viewer with syntax highlighting
   - Tabbed interface with response caching
   - Collapsible sidebar
   - Layout toggle (horizontal/vertical)

## Architecture

### Data Models

- **Request**: HTTP request with method, URL, headers, body
- **Response**: HTTP response with status, headers, body, duration
- **Collection**: Group of requests with metadata

### Storage Layer

- **RequestStore**: In-memory storage with thread-safe CRUD
- **YAMLStore**: File I/O with atomic writes
- **CollectionManager**: File system management with watching

### Services

- **HTTPService**: Async HTTP client with connection pooling

### Tauri Commands

- `execute_request`: Execute HTTP request
- `save_request`: Save request to storage
- `list_requests`: Get all requests
- `delete_request`: Remove request from storage

## Testing

### Frontend Tests

- **Framework**: Vitest with jsdom
- **Coverage**: 95.88% (199 tests)
- **Components**: Full integration tests
- **Stores**: State management tests

### Backend Tests

- **Framework**: Rust built-in + nextest
- **Coverage**: 90.91% (109 tests)
- **Models**: Complete model validation
- **Services**: HTTP integration tests
- **Storage**: File operations and thread safety

### CI/CD

- **GitHub Actions**: Automated testing and building
- **Coverage**: Enforced thresholds (75% frontend, 80% backend)
- **Quality Gates**: ESLint, TypeScript, clippy, rustfmt

## Next Steps

See `docs/plan/README.md` for the full development roadmap.

### Completed Phases ✅

- **Phase 1.1**: Project initialization with Tauri 2.x + Svelte 5
- **Phase 1.2**: Testing infrastructure (Vitest + cargo-tarpaulin)
- **Phase 1.3**: Core data models (Request, Response, Collection)
- **Phase 2.1**: HTTP service with async reqwest
- **Phase 2.2**: In-memory request storage
- **Phase 2.3**: Tauri commands for IPC
- **Phase 3.1**: Theme system with WCAG compliance
- **Phase 3.2**: i18n setup with 5 languages
- **Phase 3.3**: Request list component
- **Phase 3.4**: Request editor component
- **Phase 3.5**: Response viewer component
- **Phase 3.6**: Request runner integration
- **Phase 3.7**: UI/UX overhaul (tabs, toolbar, caching)
- **Phase 4.1**: YAML storage implementation
- **Phase 4.2**: Collection file system with watching

### Next Phase 🚀

- **Phase 4.3**: File management commands
  - Tauri commands for collection operations
  - Native file picker integration
  - Permission error handling
  - Integration tests

### Current Metrics

- **Total Tests**: 308 (199 frontend + 109 backend)
- **Frontend Coverage**: 95.88%
- **Backend Coverage**: 90.91%
- **Components**: 10 (UI + stores)
- **Storage Modules**: 3 (RequestStore, YAMLStore, CollectionManager)
- **i18n Languages**: 5 (525+ keys each)
- **Version**: 0.4.2
