# Arcanine - Project Structure

This document describes the project structure and key files for developers.

## Directory Structure

```
arcanine/
├── src/                          # Frontend (Svelte)
│   ├── lib/
│   │   ├── components/          # Reusable UI components
│   │   │   └── ThemeToggle.svelte
│   │   ├── i18n/                # Internationalization
│   │   │   ├── index.ts         # i18n store and utilities
│   │   │   └── locales/         # Translation files
│   │   │       └── en.json      # English translations
│   │   └── stores/              # Svelte stores
│   │       └── theme.ts         # Theme management store
│   ├── routes/                  # SvelteKit routes
│   │   ├── +layout.svelte       # Root layout with theme/i18n init
│   │   ├── +layout.ts           # Layout config
│   │   └── +page.svelte         # Home page
│   ├── app.css                  # Global styles with CSS variables
│   └── app.html                 # HTML template
│
├── src-tauri/                   # Backend (Rust)
│   ├── src/                     # Rust source code
│   │   └── main.rs              # Application entry point
│   ├── capabilities/            # Tauri capabilities
│   ├── icons/                   # App icons
│   ├── Cargo.toml               # Rust dependencies
│   ├── rustfmt.toml             # Rust formatting config
│   └── tauri.conf.json          # Tauri configuration
│
├── docs/                        # Documentation
│   ├── architecture/            # Architecture documentation
│   └── plan/                    # Development plan
│
├── .eslintrc.cjs                # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── tailwind.config.js           # TailwindCSS configuration
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── svelte.config.js             # Svelte configuration
├── vite.config.js               # Vite configuration
├── package.json                 # Node.js dependencies
└── README.md                    # Main README
```

## Key Technologies

### Frontend
- **Svelte 5**: Reactive UI framework
- **SvelteKit**: Application framework
- **TypeScript**: Type-safe JavaScript (strict mode enabled)
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Build tool and dev server

### Backend
- **Tauri 2.x**: Desktop application framework
- **Rust**: Systems programming language

### Development Tools
- **Prettier**: Code formatter
- **ESLint**: JavaScript/TypeScript linter
- **rustfmt**: Rust code formatter

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

The i18n system is built from scratch and includes:

- **Translation files**: JSON files in `src/lib/i18n/locales/`
- **Store**: Svelte store for reactive translations
- **Persistence**: Locale preference saved to localStorage
- **Fallback**: English as default language

### Adding Translations

1. Create a new JSON file in `src/lib/i18n/locales/` (e.g., `es.json`)
2. Copy the structure from `en.json`
3. Translate the values
4. Load the translations in your component:

```typescript
import { loadTranslations, setLocale } from '$lib/i18n';

await loadTranslations('es');
setLocale('es');
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run tauri dev        # Start Tauri app in dev mode

# Building
npm run build            # Build for production
npm run tauri build      # Build Tauri app for production

# Code Quality
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run lint             # Lint code with ESLint
npm run lint:fix         # Fix linting issues
npm run check            # Type-check with svelte-check

# Rust
cd src-tauri
cargo fmt                # Format Rust code
cargo clippy             # Lint Rust code
cargo test               # Run Rust tests
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run tauri dev
   ```

3. The app will open with:
   - Theme toggle (light/dark)
   - i18n system initialized
   - Demo page showing theme colors

## Next Steps

See `docs/plan/README.md` for the full development roadmap.

Current status: **Phase 1.1 Complete** ✅
- Tauri 2.x project initialized
- Svelte 5 with TypeScript (strict mode)
- Theme system with CSS variables
- i18n infrastructure
- Code formatters (Prettier, rustfmt)
- Linters (ESLint)
- Build tools configured (Vite, Cargo)
