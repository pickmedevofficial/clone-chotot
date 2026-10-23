# Node.js and OSV Security Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pin the project to the patched Node.js 24.22.1 LTS runtime and add continuous OSV vulnerability scanning for the pnpm dependency graph.

**Architecture:** Runtime compatibility is declared in standard version-manager files and `package.json`, with the Node.js type package and pnpm lockfile aligned to the same major. Dependency security is enforced through Google's maintained OSV reusable GitHub workflows, while the README documents both runtime setup and local scanning.

**Tech Stack:** Node.js 24.22.1 LTS, pnpm 11.1.1, Next.js 16.4.1, GitHub Actions, OSV-Scanner 2.7.0

**Spec:** `docs/superpowers/specs/2026-10-23-node-osv-security-design.md`

## Global Constraints

- Pin Node.js exactly to `24.22.1` in version-manager files and support only the Node.js 24 release line in `package.json`.
- Keep pnpm at `11.1.1`; do not upgrade Next.js, React, pnpm, or unrelated application packages.
- Use OSV-Scanner reusable workflows at `v2.7.0`; do not add an OSV npm dependency.
- Scan the committed `pnpm-lock.yaml` without vulnerability suppressions or automatic remediation.
- Give GitHub workflows only `actions: read`, `contents: read`, and `security-events: write` permissions.

## Review Focus

- A developer using `.nvmrc` or `.node-version` gets exactly Node.js 24.22.1, not an unpatched earlier Node.js 24 release.
- Package-manager validation rejects Node.js 22 and Node.js 25 while allowing patched Node.js 24 releases.
- Lockfile regeneration changes only Node.js type-related resolution data and does not opportunistically upgrade application dependencies.
- Pull-request scanning compares new vulnerabilities, while the full scan still runs after pushes to `main` and on the weekly schedule.
- Forked pull requests have no write access beyond the reusable workflow's documented minimum permissions, and workflow YAML remains valid.

---

### Task 1: Pin and align the Node.js runtime

**Files:**
- Create: `.nvmrc`
- Create: `.node-version`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Node.js 24.22.1 and the existing `packageManager: pnpm@11.1.1` declaration.
- Produces: identical runtime pins in `.nvmrc` and `.node-version`, `engines.node` set to `>=24.22.1 <25`, and Node.js 24 TypeScript definitions recorded in the lockfile.

- [ ] **Step 1: Run a configuration assertion that demonstrates the runtime pins are absent**

Run: `test "$(cat .nvmrc 2>/dev/null)" = "24.22.1" && test "$(cat .node-version 2>/dev/null)" = "24.22.1" && node -e "const p=require('./package.json'); if (p.engines?.node !== '>=24.22.1 <25' || p.devDependencies?.['@types/node'] !== '^24') process.exit(1)"`

Expected: FAIL because the version files and `engines.node` do not exist and `@types/node` is still on major 20.

- [ ] **Step 2: Add the runtime declarations**

Create `.nvmrc` and `.node-version` with the single value `24.22.1`. Add `"engines": { "node": ">=24.22.1 <25" }` beside `packageManager` in `package.json`, and change `@types/node` from `^20` to `^24`.

- [ ] **Step 3: Regenerate only the dependency lockfile under Node.js 24.22.1**

Run: `corepack pnpm install --lockfile-only`

Expected: exit 0; `pnpm-lock.yaml` records the Node.js 24 type package without unrelated manifest changes.

- [ ] **Step 4: Verify exact pins, the supported major range, and lockfile scope**

Run the Step 1 assertion again.

Expected: exit 0.

Run: `git diff -- .nvmrc .node-version package.json pnpm-lock.yaml`

Expected: exact Node.js pins, the engine range, the `@types/node` major update, and only the corresponding lockfile resolution changes.

- [ ] **Step 5: Verify install and project behavior under the pinned runtime**

Run: `node --version && corepack pnpm --version && corepack pnpm install --frozen-lockfile && corepack pnpm lint && corepack pnpm test && corepack pnpm build`

Expected: Node prints `v24.22.1`, pnpm prints `11.1.1`, and all commands exit 0.

- [ ] **Step 6: Commit the runtime update**

```bash
git add .nvmrc .node-version package.json pnpm-lock.yaml
git commit -m "chore: upgrade runtime to Node 24.22.1"
```

### Task 2: Add OSV dependency scanning and documentation

**Files:**
- Create: `.github/workflows/osv-scanner-pr.yml`
- Create: `.github/workflows/osv-scanner-scheduled.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: committed `pnpm-lock.yaml`, default branch `main`, and Google's `osv-scanner-reusable-pr.yml@v2.7.0` and `osv-scanner-reusable.yml@v2.7.0` workflows.
- Produces: PR/merge-queue regression scanning, full scans on `main` and Mondays at 12:30 UTC, SARIF uploads to GitHub Security, and documented local usage.

- [ ] **Step 1: Run workflow assertions that demonstrate OSV scanning is absent**

Run: `test -f .github/workflows/osv-scanner-pr.yml && test -f .github/workflows/osv-scanner-scheduled.yml && rg -q "osv-scanner-reusable-pr.yml@v2.7.0" .github/workflows/osv-scanner-pr.yml && rg -q "osv-scanner-reusable.yml@v2.7.0" .github/workflows/osv-scanner-scheduled.yml`

Expected: FAIL because neither workflow exists.

- [ ] **Step 2: Add the pull-request OSV workflow**

Create `.github/workflows/osv-scanner-pr.yml` with `pull_request` and `merge_group` triggers restricted to `main`, top-level permissions `actions: read`, `contents: read`, and `security-events: write`, and one `scan-pr` job using `google/osv-scanner-action/.github/workflows/osv-scanner-reusable-pr.yml@v2.7.0`. Pass `scan-args` containing only `--lockfile=./pnpm-lock.yaml`.

- [ ] **Step 3: Add the full OSV workflow**

Create `.github/workflows/osv-scanner-scheduled.yml` with a push trigger restricted to `main` and schedule `30 12 * * 1`, the same minimum permissions, and one `scan-scheduled` job using `google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@v2.7.0`. Pass `scan-args` containing only `--lockfile=./pnpm-lock.yaml`; retain the reusable workflow defaults `fail-on-vuln: true` and `upload-sarif: true`.

- [ ] **Step 4: Document runtime setup and security scans**

Update `README.md` so the run instructions state Node.js 24.22.1 and show `nvm use` before `pnpm install`. Add a security section explaining PR comparison scans, push/weekly full scans, GitHub Security results, and optional local execution with `osv-scanner scan source --lockfile=pnpm-lock.yaml`.

- [ ] **Step 5: Validate workflow syntax, triggers, permissions, and exact scanner version**

Run: `ruby -e "require 'yaml'; ARGV.each { |f| YAML.parse_file(f) }" .github/workflows/osv-scanner-pr.yml .github/workflows/osv-scanner-scheduled.yml`

Expected: exit 0 with no YAML parse errors.

Run: `rg -n "pull_request|merge_group|push:|cron:|actions: read|contents: read|security-events: write|osv-scanner-reusable(-pr)?\\.yml@v2\\.7\\.0|pnpm-lock\\.yaml" .github/workflows README.md`

Expected: both workflows use v2.7.0 and the pnpm lockfile; PR/merge-queue and push/schedule triggers plus all three permissions are present.

- [ ] **Step 6: Run OSV against the lockfile when the binary is available**

Run: `osv-scanner scan source --lockfile=pnpm-lock.yaml`

Expected: the scanner parses the pnpm lockfile and exits 0 when no known vulnerability is present; otherwise preserve the findings and report them without adding ignores or automatic fixes.

- [ ] **Step 7: Re-run the complete project verification**

Run: `corepack pnpm lint && corepack pnpm test && corepack pnpm build && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 8: Commit the OSV integration and documentation**

```bash
git add .github/workflows/osv-scanner-pr.yml .github/workflows/osv-scanner-scheduled.yml README.md
git commit -m "ci: add OSV dependency scanning"
```
