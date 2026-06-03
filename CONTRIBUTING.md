# Contributing

Thanks for your interest in improving `eslint-plugin-tailwind-design-tokens`. Issues and PRs are
welcome.

## Getting started

```sh
npm install
npm run build      # compile TypeScript to dist/
npm test           # vitest (watch); use `npm test -- --run` for a single pass
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Requires **ESLint 9+** and **Node 20+**.

## Project layout

- `src/rules/*.ts` — the rules (`no-hardcoded-colors`, `no-default-palette`).
- `src/lib/*.ts` — shared helpers: color parsing (`colors.ts`), token loading (`tokens.ts`),
  Tailwind class detection (`tailwind.ts`), the `allow` matcher (`allow.ts`).
- `src/index.ts` — plugin entry: rule map + `recommended` / `flat/recommended` configs.
- `tests/` — mirrors `src/`. Rule specs use ESLint's `RuleTester` wired into Vitest.
- `docs/rules/*.md` — per-rule docs (the header block is auto-generated; see below).
- `examples/` — a runnable example wiring both Tailwind token sources; see `examples/README.md`.

## Tests

- Written with Vitest. Rule behaviour is covered with `RuleTester`; option-schema rejection is
  covered with the `Linter` API in `tests/rules/schema.test.ts`.
- Test descriptions start with **"should"** (e.g. `it('should flag a bare hex', …)`).
- Add tests with every rule or helper change. Run `npm test -- --run` before pushing.

## Docs are generated — don't hand-edit the generated parts

The README rules table and each rule doc's header are generated from rule `meta` by
[`eslint-doc-generator`](https://github.com/bmish/eslint-doc-generator). After **any** change to a
rule's `meta` (description, `fixable`, `hasSuggestions`, schema, configs), regenerate:

```sh
npm run doc
```

CI runs `npm run doc:check` and fails if the committed docs are stale. Notes:

- Only edit prose **outside** the auto-generated markers
  (`<!-- begin/end auto-generated rules list -->` in the README, `<!-- end auto-generated rule header -->`
  in rule docs).
- `doc:check` deliberately uses `npm run doc` + `git diff` rather than `eslint-doc-generator --check`,
  because the generator and Prettier disagree on the rules-table emoji-column layout. **Don't** switch
  it back to `--check`.

## Commits & releases

This repo uses **Conventional Commits** and [release-please](https://github.com/googleapis/release-please)
for automated releases. Your commit type drives the version bump:

- `feat:` → minor release
- `fix:` → patch release
- `docs:` / `chore:` / `test:` / `ci:` / `refactor:` → no release

Releases are published from CI with npm provenance — no manual `npm publish`. The project is pre-1.0;
`release-please-config.json` sets `bump-minor-pre-major`, so even a `BREAKING CHANGE:` footer bumps the
minor, not the major.

## Pull requests

1. Branch off `main`.
2. Make your change with tests and (if rule `meta` changed) regenerated docs.
3. Ensure the full gate is green locally: `npm run lint && npm run typecheck && npm test -- --run`.
4. Push and open a PR against `main`. CI runs the suite across Node 20/22/24 and ESLint 9/10.

### Maintainer note: changing the CI matrix

Branch protection on `main` pins **required status checks to literal CI job names** (e.g.
`test (24, 10)`). If you change the matrix in `.github/workflows/ci.yml`, the job names change and the
old required checks become orphaned, blocking all PRs. After such a change, repoint the required
checks in **Settings → Branches** (or via `gh api … /branches/main/protection/required_status_checks`).
