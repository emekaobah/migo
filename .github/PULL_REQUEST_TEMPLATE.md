<!--
Title must be Conventional Commits: type(scope): subject
Scopes: theme ui lib state api data | enrolment session loans repayment support account
        | app dev native build config deps test e2e ci   (see design/PLAN.md §2)
-->

## What

<!-- One paragraph. What changed and why. -->

## Phase

<!-- Which phase of design/PLAN.md §8 this belongs to, or "n/a". -->

## Verification

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test` <!-- once the Phase 1 test stack lands -->
- [ ] Checked on device — iOS **and** Android (§8a requires both)

<!-- Paste real output or say which checks you skipped and why. -->

## Not verifiable here

<!-- Per PLAN §8a: SMS Retriever, iOS biometrics under Maestro, anything needing Migo's servers.
     Delete if nothing applies. -->
