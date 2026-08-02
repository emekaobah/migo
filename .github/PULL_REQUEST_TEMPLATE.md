<!--
Title must be Conventional Commits: type(scope): subject
Scopes: theme ui lib state api data | enrolment session loans repayment support account
        | app dev native build config deps test e2e ci   (see commitlint.config.mjs)
-->

## What

<!-- One paragraph. What changed and why. -->

## Phase

<!-- Which phase this belongs to, or "n/a". Phases are defined in the local (untracked)
     design/PLAN.md §8 — not in this repo. -->

## Verification

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test` <!-- once the Phase 1 test stack lands -->
- [ ] Checked on device — iOS **and** Android (both are required)

<!-- Paste real output or say which checks you skipped and why. -->

## Not verifiable here

<!-- Known gaps: SMS Retriever, iOS biometrics under Maestro, anything needing Migo's servers.
     Delete if nothing applies. -->
