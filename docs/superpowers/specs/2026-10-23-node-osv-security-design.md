# Node.js and OSV security update

## Intent

Move the project from an unspecified, locally inconsistent Node.js runtime to the patched Node.js 24 LTS release, and continuously detect known dependency vulnerabilities in the committed pnpm lockfile.

## Goals

- Pin Node.js `24.22.1`, the 2026-10-21 LTS security release, for version managers and declare the supported runtime in `package.json`.
- Align the Node.js TypeScript definitions with Node.js 24 and refresh `pnpm-lock.yaml` without changing unrelated dependencies.
- Add OSV-Scanner GitHub workflows that compare newly introduced vulnerabilities on pull requests and perform a complete scan on pushes to `main` and weekly.
- Document the required runtime and security scan behavior in the README.

## Non-goals and anti-goals

- Do not upgrade Next.js, React, pnpm, or unrelated application packages.
- Do not suppress, ignore, or automatically remediate vulnerability findings.
- Do not add an OSV binary as an npm dependency; use Google's maintained reusable GitHub workflows.
- Do not change application behavior.

## Constraints

- Next.js 16.4.1 requires Node.js 20.9 or newer; Node.js 24.22.1 satisfies that requirement.
- The repository uses pnpm 11.1.1, which requires Node.js 22.13 or newer.
- GitHub workflows receive only the minimum permissions required to read the repository and upload SARIF results.

## Approaches considered

- **Selected: Node.js 24.22.1 LTS plus OSV pull-request and scheduled/full scans.** This uses the newer supported LTS line and provides both regression protection and ongoing discovery of newly disclosed vulnerabilities.
- Node.js 22.23.4 LTS with the same scans. This minimizes the major-version jump but has a shorter remaining support window.
- A local-only OSV command. This is easier to add, but it does not ensure scans run or surface results in GitHub Security.

## Implementation outline

- Add `.nvmrc` and `.node-version` containing `24.22.1`.
- Add `engines.node` to `package.json`, update `@types/node` to the Node.js 24 line, and regenerate the pnpm lockfile.
- Add the official OSV-Scanner v2.7.0 reusable workflows for pull requests/merge queues and for full scans on `main` plus a weekly schedule.
- Update README setup and security-check documentation.
- Verify configuration syntax, dependency installation, lint, tests, and production build under Node.js 24.22.1; run an OSV scan when the scanner can be installed or executed in the environment.
