# Phase End Procedure

This document defines the standard procedure for completing ANY development phase in Arcanine. These steps MUST be followed at the end of every phase after completing all phase-specific implementation tasks.

## Standard Phase Completion Steps

Every phase ends with these seven mandatory steps (typically steps 14-20 in the execution plan):

### Step 1: Run All Validation Checks

Execute the complete validation suite to ensure all changes meet quality standards:

```bash
# Frontend validation
npm run lint              # ESLint check
npm run check             # TypeScript/Svelte type check
npm run test:coverage     # Tests with coverage (verify ≥75%)

# Rust validation
cd src-tauri
cargo fmt --check         # Rust formatting check
cargo clippy -- -D warnings  # Rust linting (no warnings)
cd ..
npm run test:rust:coverage   # Rust tests with coverage (verify ≥80%)

# Build verification
npm run build             # Production build must succeed
```

**Expected Results:**

- ✅ No linting errors
- ✅ No type errors
- ✅ All tests pass
- ✅ Frontend coverage ≥75% (target: 90%+)
- ✅ Rust coverage ≥80% (target: 90%+)
- ✅ No clippy warnings
- ✅ Build succeeds

**If any check fails:**

1. Fix the issue immediately
2. Re-run all validation checks
3. Do not proceed until all checks pass

### Step 2: Update Version Numbers

Update version in all three configuration files to reflect the completed phase:

**Files to Update:**

1. `package.json` - Line ~3: `"version": "0.X.X"`
2. `src-tauri/Cargo.toml` - Line ~3: `version = "0.X.X"`
3. `src-tauri/tauri.conf.json` - Line ~3: `"version": "0.X.X"`

**Version Naming Convention:**

- Format: `0.PHASE.SUBPHASE`
- Example: Phase 4.3 → `0.4.3`
- Example: Phase 5.1 → `0.5.1`

**Commands:**

```bash
# Update all three files with the new version
# Then verify the changes
git diff package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
```

### Step 3: Perform Manual Validation

Beyond automated tests, perform manual validation to ensure the phase implementation works as expected:

**Manual Validation Checklist:**

- [ ] Start the application (`npm run tauri dev`)
- [ ] Test the new feature/functionality implemented in this phase
- [ ] Verify UI renders correctly (if applicable)
- [ ] Check theme support (light/dark modes work)
- [ ] Test with different languages (i18n switching)
- [ ] Verify no console errors or warnings
- [ ] Test error handling and edge cases
- [ ] Confirm existing functionality still works (no regressions)

**Document any issues found and fix them before proceeding.**

### Step 4: Update Documentation

Create comprehensive documentation for the completed phase:

#### A. Create Phase Completion Report

Create `docs/progress/phase-X.X-completion.md` with:

```markdown
# Phase X.X Completion Report

## Overview

[Brief description of what was accomplished]

## Implementation Details

[Technical approach and key decisions]

## Files Created/Modified

[Complete list of changed files]

## Testing

- Tests Added: [count]
- Coverage: [percentage]
- All validation checks: ✅ Pass

## Metrics

- Lines of Code: [frontend] + [backend]
- Test Count: [total]
- Coverage: [frontend]% frontend, [backend]% backend

## Validation Checklist

- [x] All phase tasks completed
- [x] All tests pass
- [x] Coverage thresholds met
- [x] Manual validation successful
- [x] Documentation complete

## Next Steps

[Recommendations for next phase]
```

#### B. Update Related Documentation

Update these files if the phase introduced changes:

- `README.md` - Update features list, current version, status
- `docs/architecture/README.md` - Update implementation status
- `docs/progress/README.md` - Add phase to completed list
- Any architecture docs relevant to the phase

### Step 5: Commit Changes

Create a concise conventional commit message following the project standards:

**Commit Message Format:**

```
<type>(<scope>): <subject>

<body>
```

**Example Commit Messages:**

```bash
# Feature completion
git add .
git commit -m "feat(storage): file management commands

- Implement load_collection Tauri command
- Add save_collection and create_new_collection commands
- Integrate native file picker for collection selection
- Add collection validation with error handling
- Test file commands on all platforms
- Add error recovery mechanisms
- Write comprehensive integration tests
```

```bash
# UI phase completion
git commit -m "feat(ui): complete Phase 3.7 internationalization

- Add 5 language translations (en, es, fr, de, ja)
- Implement LanguageSwitcher component
- Add svelte-i18n integration
- Create translation store
- Test language switching
- Add i18n utility functions
```

**Commit Guidelines:**

- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- Don't capitalize first letter of subject
- No period at end of subject
- Reference issue numbers if applicable

### Step 6: Push Branch to Origin

Push the feature branch to the remote repository:

```bash
# Verify you're on the correct branch
git branch --show-current  # Should show: phase-X.X

# Push to origin
git push origin phase-X.X

# Or if first push
git push -u origin phase-X.X
```

**Before pushing, verify:**

- [ ] All changes are committed
- [ ] Commit message follows conventions
- [ ] No uncommitted changes remain
- [ ] No merge conflicts with main

### Step 7: Create Pull Request

Create a pull request following the project's PR template and conventions:

#### PR Title Format

```
feat(scope): Phase X.X - [Phase Name]
```

**Examples:**

- `feat(storage): File Management Commands`
- `feat(variables): Variable Data Model`
- `feat(ui): Internationalization`

#### PR Description Template

````markdown
## Phase X.X: [Phase Name]

### Overview

[Brief description of the phase objectives and what was accomplished]

### Changes Made

- [Key change 1]
- [Key change 2]
- [Key change 3]

### Files Changed

- Created: [list new files]
- Modified: [list modified files]

### Testing

- **Total Tests**: [count] ([frontend] frontend + [backend] backend)
- **Coverage**: [frontend]% frontend, [backend]% backend
- **Manual Validation**: ✅ Complete

### Validation Results

```bash
✅ npm run lint
✅ npm run check
✅ npm run test:coverage (≥90% line; ≥80% branches)
✅ cargo fmt --check
✅ cargo clippy (no warnings)
✅ npm run test:rust:coverage (≥90%)
✅ npm run build
```

### Documentation

- [x] Phase completion report created
- [x] Architecture docs updated
- [x] README.md updated
- [x] Version numbers updated

### Checklist

- [x] All phase tasks completed
- [x] All validation checks pass
- [x] Coverage thresholds met
- [x] Manual testing performed
- [x] Documentation complete
- [x] Conventional commit message
- [x] Ready for review

### Next Phase

[Brief note about what Phase X.X+1 will cover]

---

**Version**: 0.X.X  
**Closes**: #[issue-number] (if applicable)
````

## Why These Steps Matter

1. **Quality Assurance**: Comprehensive validation ensures code quality
2. **Traceability**: Documentation provides clear history of changes
3. **Collaboration**: Proper PR process enables effective code review
4. **Consistency**: Standard procedures maintain project quality
5. **Knowledge Transfer**: Good documentation helps current and future contributors

## Common Pitfalls to Avoid

❌ **Don't:**

- Skip validation checks ("I'll fix it later")
- Delete or comment tests
- Disable validations or reduce thresholds
- Forget to update version numbers
- Create PR without testing
- Write vague commit messages
- Skip documentation
- Merge without review
- Leave branches undeleted

✅ **Do:**

- Run all checks before committing
- Update all three version files
- Test manually before PR
- Write descriptive commits
- Document thoroughly
- Wait for approval
- Clean up after merge

## Reference

For complete development guidelines, see:

- [Phase Start Procedure](phase-start.md) - How to start a phase
- [Execution Plan](../../docs/plan/execution-plan.md) - All phase tasks
- [Contributing Guide](../../CONTRIBUTING.md) - Complete contribution workflow
- [Progress Tracking](../../docs/progress/README.md) - Phase completion reports

---

**Remember:** These 7 steps conclude every phase. They ensure quality, maintainability, and clear project history.
