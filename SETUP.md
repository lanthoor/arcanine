# Arcanine - Development Setup Guide

Quick start guide for setting up Arcanine development environment.

## Prerequisites

### Required

- **Node.js**: v20+ ([download](https://nodejs.org/))
- **Rust**: Latest stable ([install via rustup](https://rustup.rs/))
- **Git**: Version control
- **pnpm/npm**: Package manager (npm comes with Node.js)

### Platform-Specific

#### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Tauri dependencies
brew install pkg-config
```

#### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### Windows

- Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/lanthoor/arcanine.git
cd arcanine
```

### 2. Install Dependencies

```bash
# Frontend dependencies
npm install

# Rust dependencies are auto-installed by cargo
```

### 3. Start Development Server

```bash
# Start Tauri app in development mode
npm run tauri dev
```

The app will open with hot reload enabled for both frontend and backend changes.

## Project Structure

```
arcanine/
├── src/                    # Frontend (Svelte 5 + TypeScript)
│   ├── lib/
│   │   ├── components/     # UI components
│   │   ├── stores/         # Svelte stores
│   │   └── i18n/           # Internationalization
│   └── routes/             # SvelteKit routes
├── src-tauri/              # Backend (Rust + Tauri 2.x)
│   └── src/
│       ├── models/         # Data models
│       ├── services/       # Business logic
│       ├── storage/        # Persistence layer
│       └── commands/       # Tauri commands
└── docs/                   # Documentation
    ├── architecture/       # Technical architecture
    ├── plan/               # Project vision and roadmap
    └── progress/           # Phase completion reports
```

For detailed directory structure, see [Architecture Documentation](docs/architecture/README.md).

## Development Scripts

### Development

```bash
npm run dev              # Start frontend dev server
npm run tauri dev        # Start full Tauri app (recommended)
```

### Testing

```bash
npm run test             # Run frontend tests
npm run test:coverage    # Frontend coverage (≥75%)
npm run test:rust        # Run Rust tests
npm run test:rust:coverage # Rust coverage (≥80%)
```

### Code Quality

```bash
npm run lint             # Lint JavaScript/TypeScript
npm run format           # Format code
npm run check            # Type-check TypeScript
npm run clippy           # Lint Rust code
```

### Building

```bash
npm run build            # Build for production
npm run tauri build      # Create distributable app
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development workflow and coding standards.

## Testing

The project uses Vitest (frontend) and Rust's built-in test framework (backend) with high coverage requirements:

- **Frontend**: ≥75% coverage (currently 95.88%)
- **Backend**: ≥80% coverage (currently 90.91%)
- **Total**: 308 tests across both layers

Run all tests before committing:

```bash
npm run test:coverage && npm run test:rust:coverage
```

## Next Steps

- **Contributing**: Read [CONTRIBUTING.md](CONTRIBUTING.md) for PR workflow and coding standards
- **Architecture**: See [docs/architecture/](docs/architecture/) for technical design decisions
- **Progress**: Check [docs/progress/summary.md](docs/progress/summary.md) for current project status
- **Roadmap**: View [docs/plan/](docs/plan/) for project vision and execution plan

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Clean Rust build
cd src-tauri && cargo clean && cd ..
```

### Tauri Development Issues

- **macOS**: Ensure Xcode Command Line Tools are installed
- **Linux**: Verify all webkit2gtk dependencies are installed
- **Windows**: Check WebView2 and C++ Build Tools are present

### Port Already in Use

```bash
# Kill process on port 1420 (Vite default)
lsof -ti:1420 | xargs kill -9
```

For more help, see [GitHub Issues](https://github.com/lanthoor/arcanine/issues) or [Discussions](https://github.com/lanthoor/arcanine/discussions).
