# macOS Build Guide

## Overview

Arcanine can be built as a native macOS application using Tauri. The build system supports both local development builds and automated GitHub Actions releases.

## Prerequisites

### Required Tools

- **Node.js** (v20 or later)
- **Rust** (1.91.1 or later)
- **npm** (comes with Node.js)

### For Local Builds

**Option 1: Native Architecture Only (Apple Silicon or Intel)**
- Homebrew Rust installation works fine
- Only builds for your current architecture
- Faster build times

**Option 2: Universal Binary (Both Intel + Apple Silicon)**
- Requires `rustup` (Rust toolchain manager)
- Install via: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Add cross-compilation targets:
  ```bash
  rustup target add x86_64-apple-darwin
  rustup target add aarch64-apple-darwin
  ```

**Note:** Homebrew Rust (`brew install rust`) does NOT include `rustup`, so you cannot build universal binaries with it. You must use the official rustup installer.

## Local Build Commands

### Build for Current Architecture

```bash
npm run tauri build
```

**Output:**
- `.app` bundle: `src-tauri/target/release/bundle/macos/arcanine.app`
- `.dmg` installer: `src-tauri/target/release/bundle/dmg/arcanine_<version>_<arch>.dmg`

### Build Universal Binary (Requires rustup)

```bash
npm run tauri build -- --target universal-apple-darwin
```

**Output:**
- `.app` bundle with both architectures
- `.dmg` installer for distribution

## Build Artifacts

### Application Bundle (.app)

Located at: `src-tauri/target/release/bundle/macos/arcanine.app`

- Standard macOS application bundle
- Can be dragged to Applications folder
- Double-click to launch

### Disk Image (.dmg)

Located at: `src-tauri/target/release/bundle/dmg/arcanine_<version>_<arch>.dmg`

- Installer package for distribution
- Opens with application and Applications folder shortcut
- Users can drag-and-drop to install

## Testing the Build

### Launch the Application

```bash
open src-tauri/target/release/bundle/macos/arcanine.app
```

### Verify Architecture

```bash
# Check which architectures are included
lipo -archs src-tauri/target/release/arcanine

# For universal binaries, should show: x86_64 arm64
# For native builds, shows only current architecture
```

## GitHub Actions Release

The automated release workflow (`.github/workflows/release.yml`) is triggered when you push a version tag:

```bash
git tag v0.2.2
git push origin v0.2.2
```

### Workflow Features

- **Automatic Release Creation**: Creates GitHub release with tag
- **Universal Binary**: Builds for both Intel and Apple Silicon
- **Multiple Formats**: Generates both `.app` and `.dmg`
- **Automatic Upload**: Uploads artifacts to GitHub release
- **Version Detection**: Extracts version from tag (e.g., `v0.2.2` → `0.2.2`)

### Build Environment

GitHub Actions uses:
- `macos-latest` runner (macOS 14)
- Official `dtolnay/rust-toolchain` action
- Installs required targets automatically
- Caches dependencies for faster builds

## Build Configuration

### Tauri Configuration

File: `src-tauri/tauri.conf.json`

```json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  }
}
```

### Supported macOS Versions

- **Minimum**: macOS 10.15 (Catalina)
- **Recommended**: macOS 11.0 (Big Sur) or later
- **Tested**: macOS 14.0 (Sonoma)

## Troubleshooting

### Error: "can't find crate for `std`"

**Cause:** Missing cross-compilation target

**Solution:**
```bash
# If using rustup
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# If using Homebrew Rust, switch to rustup
brew uninstall rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Error: "command not found: rustup"

**Cause:** Homebrew Rust doesn't include rustup

**Solution:**
- For native builds: No action needed, use `npm run tauri build`
- For universal builds: Install rustup (see Prerequisites)

### Slow Build Times

**Optimization:**
- First build: ~2-3 minutes (compiles all dependencies)
- Subsequent builds: ~30 seconds (incremental compilation)
- Use `--skip-clean` in CI for faster coverage generation

### DMG Creation Fails

**Cause:** Missing permissions or disk space

**Solution:**
- Check available disk space: `df -h`
- Ensure `~/Library/Caches/tauri` is writable
- Check system logs: `log show --predicate 'process == "tauri"' --last 1m`

## Performance Notes

### Build Times (Apple Silicon Mac)

- **Frontend (Vite + SvelteKit)**: ~250ms
- **Backend (Rust)**: ~34 seconds (504 crates)
- **Bundling**: ~3 seconds
- **Total**: ~75 seconds (cold build)

### Bundle Sizes

- **Application Bundle**: ~10-15 MB
- **DMG Installer**: ~3 MB (compressed)
- **Universal Binary**: ~20-25 MB (both architectures)

## Distribution

### Development Distribution

1. Build the DMG: `npm run tauri build`
2. Share the DMG file: `src-tauri/target/release/bundle/dmg/arcanine_*.dmg`
3. Users download and install

### Production Distribution

1. Create version tag: `git tag v0.2.2`
2. Push tag: `git push origin v0.2.2`
3. GitHub Actions builds and releases
4. Users download from GitHub Releases page

### Code Signing (Future)

For App Store or notarized distribution:
- Requires Apple Developer account ($99/year)
- Add signing certificate to Tauri config
- Enable hardened runtime
- Notarize with Apple

## References

- [Tauri Documentation](https://v2.tauri.app/)
- [Tauri macOS Bundle](https://v2.tauri.app/distribute/bundle/macos/)
- [Rust Installation](https://www.rust-lang.org/tools/install)
- [rustup Documentation](https://rust-lang.github.io/rustup/)
