# Phase Start Procedure

This document defines the standard procedure for starting ANY new development phase in Arcanine. These steps MUST be followed at the beginning of every phase before proceeding with phase-specific tasks.

## Standard Phase Start Steps

Every phase begins with these three mandatory steps:

### Step 1: Create Feature Branch

```bash
# Checkout new branch from latest main
git checkout main
git pull origin main
git checkout -b phase-X.X  # Replace X.X with actual phase number
```

**Examples:**

- `phase-4.3` - File Management Commands
- `phase-5.1` - Variable Data Model
- `phase-6.1` - Environment Data Model

### Step 2: Run All Validation Steps

Before making any changes, verify the codebase is stable by running all validation checks:

```bash
# Frontend validation
npm run lint
npm run check
npm run test:coverage

# Rust validation
cd src-tauri
cargo fmt --check
cargo clippy -- -D warnings
cd ..
npm run test:rust:coverage

# Build verification
npm run build
```

**Expected Results:**

- ✅ No linting errors
- ✅ No type errors
- ✅ All tests pass
- ✅ Frontend coverage ≥75%
- ✅ Rust coverage ≥80%
- ✅ No clippy warnings
- ✅ Build succeeds

### Step 3: Fix Validation Failures

If any validation step fails:

1. **Document the failure** - Note what failed and why
2. **Fix the issue** - Address the root cause
3. **Re-run validation** - Confirm all checks pass
4. **Await confirmation** - Report status before proceeding

**IMPORTANT:** Do NOT proceed with phase tasks until ALL validation checks pass. A stable baseline is critical for clean development.

## Why These Steps Matter

1. **Clean Starting Point**: Ensures you're building on a stable foundation
2. **Prevent Cascading Issues**: Catches existing problems before adding new code
3. **Clear Responsibility**: Separates pre-existing issues from new changes
4. **CI/CD Alignment**: Matches what CI will check on PR submission

## After Phase Start

Once all three startup steps are complete and validated:

- Begin implementing the phase-specific tasks listed in the execution plan
- Each phase has its own implementation tasks (typically 17-20 steps)
- Continue following the phase completion workflow: implement → test → document → commit → PR

## Reference

For complete validation commands and requirements, see:

- [Pre-Commit Validation](../../docs/plan/execution-plan.md#pre-commit-validation-required-for-all-phases)
- [Phase Completion Checklist](../../docs/plan/execution-plan.md#phase-completion-checklist)
- [Contributing Guide](../../CONTRIBUTING.md)

---

**Remember:** Every phase starts with these 3 steps. No exceptions.
