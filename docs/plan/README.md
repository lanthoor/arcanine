# Arcanine - Project Vision and Scope

A modern, git-friendly REST API client built with Tauri 2.x and Svelte 5, designed for developers who value version control, collaboration, and simplicity.

## Vision

**Arcanine** aims to be the REST client of choice for teams who want:

1. **Git-First Design**: All data stored in human-readable YAML files, perfect for version control
2. **Developer Experience**: Fast, keyboard-driven interface with modern tooling
3. **Team Collaboration**: Share collections via git, no cloud lock-in required
4. **Multi-Platform**: Native apps for macOS, Windows, and Linux
5. **Privacy-Focused**: All data stays local, no telemetry or cloud dependencies
6. **Extensible**: Scripting support with Deno for automation and testing

## Core Principles

### 1. Files Over Database

Collections are stored as plain-text YAML files in a directory structure:

```
my-api-collection/
├── collection.yaml         # Collection metadata
├── environments/
│   ├── dev.yaml
│   └── prod.yaml
└── requests/
    ├── auth/
    │   └── login.request.yaml
    └── users/
        ├── get-user.request.yaml
        └── create-user.request.yaml
```

**Benefits:**

- Easy to version control with git
- Readable diffs in pull requests
- Merge conflicts are manageable
- No vendor lock-in
- Can edit manually if needed

### 2. Developer Experience First

- **Fast Startup**: Native Tauri app with minimal overhead
- **Keyboard-Driven**: Complete keyboard navigation and shortcuts
- **Dark/Light Themes**: WCAG-compliant themes with smooth transitions
- **Internationalization**: Support for 5+ languages built-in
- **TypeScript**: Type-safe codebase for reliability
- **Modern UI**: Clean, intuitive interface with Svelte 5 reactivity

### 3. Team Collaboration

- **Git Workflows**: Share collections via GitHub/GitLab/Bitbucket
- **Code Review**: Review API changes in PRs
- **No Cloud Required**: Everything works offline
- **Secrets Management**: Separate secrets files (gitignored by default)
- **File Watching**: Auto-reload when files change (team member edits)

### 4. Testing & Automation

- **Pre-request Scripts**: Modify requests before sending (Deno runtime)
- **Post-response Scripts**: Extract data, set variables
- **Test Assertions**: Validate responses automatically
- **Request Chaining**: Use response data in subsequent requests
- **Bulk Execution**: Run entire folders or collections

### 5. Privacy & Security

- **Local Storage**: All data stays on your machine
- **No Telemetry**: Zero tracking or analytics
- **Secrets Protection**: Gitignore secrets automatically
- **Sandboxed Scripts**: Deno runtime with restricted permissions

## Target Users

### Primary Audience

1. **Backend Engineers**: Building and testing APIs
2. **Full-Stack Developers**: Working on client-server applications
3. **QA Engineers**: Automated API testing
4. **DevOps Engineers**: API monitoring and validation
5. **Technical Teams**: Collaborating on API documentation

### User Personas

**Sarah - Backend Engineer**

- Works on microservices team
- Needs to test dozens of endpoints daily
- Wants to share API tests with team via git
- Values keyboard shortcuts and speed

**Marcus - QA Engineer**

- Writes automated API tests
- Needs scriptable requests with assertions
- Wants CI/CD integration
- Requires detailed error reporting

**Lisa - Team Lead**

- Reviews API changes in PRs
- Needs readable diffs in git
- Wants team standardization
- Values documentation capabilities

## Project Scope

### In Scope (V1.0)

#### Core Features

- ✅ **HTTP Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- ✅ **Request Building**: Headers, query params, body (JSON, text, form)
- ✅ **Response Viewing**: Syntax highlighting, formatting, statistics
- ✅ **Collections**: Organize requests into folders and subfolders
- ✅ **Environments**: Switch between dev/staging/production
- ✅ **Variables**: Collection and environment variables with {{syntax}}
- ✅ **File Storage**: YAML-based with atomic writes
- ✅ **File Watching**: Auto-reload on external changes

#### Advanced Features (Planned)

- ⏳ **Authentication**: Bearer, Basic, API Key, OAuth2, AWS Sig V4
- ⏳ **Scripting**: Pre-request, post-response, and test scripts (Deno)
- ⏳ **Test Assertions**: Validate responses with JavaScript
- ⏳ **Request History**: SQLite-based execution history
- ⏳ **Import/Export**: Postman, Insomnia, OpenAPI, cURL
- ⏳ **GraphQL**: Native GraphQL support with introspection
- ⏳ **WebSockets**: WebSocket connections and message testing

#### User Experience

- ✅ **Themes**: Light and dark modes
- ✅ **i18n**: English, Spanish, French, German, Japanese
- ⏳ **Accessibility**: WCAG AAA compliance, screen reader support
- ⏳ **Keyboard Shortcuts**: Complete keyboard navigation
- ⏳ **Search**: Global search across all requests

#### Platform Support

- ✅ **macOS**: Native Apple Silicon and Intel builds
- ⏳ **Windows**: Native Windows builds
- ⏳ **Linux**: .deb, AppImage, and other formats

### Out of Scope (V1.0)

**Cloud Features** (may come in future versions):

- Cloud synchronization
- Team workspaces (cloud-based)
- Usage analytics
- Centralized secret management

**Enterprise Features** (post V1.0):

- Single Sign-On (SSO)
- Role-Based Access Control
- Audit logs
- Custom authentication plugins

**Advanced Protocols** (post V1.0):

- gRPC support
- Server-Sent Events (SSE)
- MQTT
- WebRTC

**Developer Tools** (post V1.0):

- Code generation (client libraries)
- API documentation generator
- Mock server built-in
- Performance profiling

## Development Phases

The project is organized into 20 phases, grouped into 4 major milestones. See [execution-plan.md](./execution-plan.md) for detailed task breakdowns.

### Milestone 1: Foundation & MVP (Phases 1-4) ✅

**Status**: Complete  
**Duration**: 4 weeks  
**Deliverables**:

- Working HTTP client with all methods
- File-based YAML storage
- Basic UI with themes and i18n
- Collection management

**Completed Phases:**

- Phase 1.1: Project initialization ✅
- Phase 1.2: Testing infrastructure ✅
- Phase 1.3: Core data models ✅
- Phase 2.1: HTTP service ✅
- Phase 2.2: Request storage ✅
- Phase 2.3: Tauri commands ✅
- Phase 3.1-3.7: UI implementation ✅
- Phase 4.1: YAML storage ✅
- Phase 4.2: Collection file system ✅

### Milestone 2: Variables & Environments (Phases 5-7)

**Status**: Planned  
**Duration**: 3 weeks  
**Deliverables**:

- Variable system with {{syntax}}
- Multiple environments
- Secrets management
- Variable resolution engine

**Phases:**

- Phase 5.1-5.4: Variables system
- Phase 6.1-6.3: Environments
- Phase 7.1-7.3: Secrets management

### Milestone 3: Organization & Features (Phases 8-14)

**Status**: Planned  
**Duration**: 7 weeks  
**Deliverables**:

- Folder hierarchy
- Advanced request features
- Request history
- Scripting and testing
- Response processing
- Import/export
- Additional protocols (GraphQL, WebSocket)

**Phases:**

- Phase 8: Folders & organization
- Phase 9: Advanced request features
- Phase 10: Request history
- Phase 11: Scripts & testing
- Phase 12: Response processing
- Phase 13: Import/export
- Phase 14: Additional protocols

### Milestone 4: Polish & Release (Phases 15-19)

**Status**: Planned  
**Duration**: 5 weeks  
**Deliverables**:

- Performance optimization
- Enhanced theming
- Extended i18n
- Accessibility
- File watching
- Comprehensive testing
- V1.0 release

**Phases:**

- Phase 15: Polish & performance
- Phase 16: Advanced features
- Phase 17: File watching & collaboration
- Phase 18: Testing & quality
- Phase 19: Release preparation

## Success Metrics

### Development Metrics

- **Test Coverage**: ≥90% (currently: 95.88% frontend, 90.91% backend)
- **Performance**: App startup < 1 second
- **Bundle Size**: < 50MB installed
- **Memory Usage**: < 150MB idle

### User Metrics (Post-Launch)

- **GitHub Stars**: 1,000+ in first year
- **Active Users**: 5,000+ monthly active users
- **Community**: 10+ contributors
- **Feedback**: 4.5+ star rating

### Quality Metrics

- **CI/CD**: All PRs pass automated tests
- **Code Quality**: Zero clippy warnings, ESLint errors
- **Documentation**: Complete user and developer docs
- **Accessibility**: WCAG AAA compliance

## Technology Stack

### Frontend

- **Svelte 5**: Modern reactive framework
- **SvelteKit**: Application framework
- **TypeScript**: Type safety
- **TailwindCSS**: Utility-first styling
- **Vite**: Fast build tool
- **Vitest**: Testing framework

### Backend

- **Tauri 2.x**: Native app framework
- **Rust**: Systems programming language
- **reqwest**: HTTP client
- **tokio**: Async runtime
- **serde**: Serialization
- **notify**: File system watching

### Testing

- **Vitest**: Frontend unit/integration tests
- **Rust tests**: Backend unit tests
- **cargo-tarpaulin**: Coverage reporting
- **GitHub Actions**: CI/CD automation

## Competitive Landscape

### Comparisons

| Feature            | Arcanine        | Postman        | Insomnia    | HTTPie Desktop |
| ------------------ | --------------- | -------------- | ----------- | -------------- |
| **Git-friendly**   | ✅ YAML files   | ❌ Binary DB   | ⚠️ JSON     | ⚠️ JSON        |
| **Local-first**    | ✅ Always       | ⚠️ Optional    | ✅ Yes      | ✅ Yes         |
| **Open Source**    | ✅ MIT          | ❌ Proprietary | ✅ MIT      | ✅ Apache      |
| **Cross-platform** | ✅ Native       | ✅ Electron    | ✅ Electron | ✅ Electron    |
| **Team Collab**    | ✅ Git          | ✅ Cloud       | ✅ Sync     | ❌ None        |
| **Privacy**        | ✅ No telemetry | ❌ Telemetry   | ⚠️ Optional | ✅ None        |
| **Scripting**      | ✅ Deno         | ✅ Custom      | ⚠️ Limited  | ❌ None        |
| **File Size**      | 🟢 <50MB        | 🔴 ~200MB      | 🟠 ~100MB   | 🟠 ~100MB      |

### Key Differentiators

1. **Git-First**: Unlike Postman's binary database, Arcanine uses plain YAML
2. **Privacy**: No telemetry, cloud-optional (vs. Postman's required account)
3. **Performance**: Native Tauri app vs. heavy Electron apps
4. **Collaboration**: Git workflows instead of proprietary sync
5. **Simplicity**: Focused feature set vs. bloated alternatives

## Future Vision (Beyond V1.0)

### Plugin System

- Custom authentication methods
- Protocol extensions (gRPC, MQTT)
- Theme marketplace
- Export format plugins

### AI Integration

- Generate requests from natural language
- Auto-generate test assertions
- Smart variable suggestions
- API documentation parsing

### Team Features

- Optional cloud backup (encrypted)
- Team activity feed
- Request comments and annotations
- Conflict resolution helpers

### Developer Tools

- Code generation (multiple languages)
- Mock server built-in
- API monitoring dashboards
- Performance profiling

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines and [execution-plan.md](./execution-plan.md) for detailed phase breakdowns.

## Project Status

**Current Version**: 0.4.2  
**Current Phase**: 4.2 Complete (Collection File System)  
**Next Phase**: 4.3 (File Management Commands)

For detailed progress tracking, see [docs/progress/summary.md](../progress/summary.md).

---
