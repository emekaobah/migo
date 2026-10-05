<!--
Title must be Conventional Commits: type(scope): subject
Scopes: theme ui lib state api data | enrolment session loans repayment support account
        | app dev native build config deps test e2e ci   (see commitlint.config.mjs)
-->

## What

<!-- One paragraph. What changed and why. -->

## Verification

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] Checked on device — iOS **and** Android (both are required)

<!-- Paste real output or say which checks you skipped and why. -->

## Not verifiable here

<!-- Known gaps: SMS Retriever, iOS biometrics under Maestro, anything needing Migo's servers.
     Delete if nothing applies. -->
