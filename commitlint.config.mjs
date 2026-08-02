/**
 * Conventional Commits, enforced locally by husky (commit-msg) and on PR titles
 * by .github/workflows/pr-title.yml. Keep the scope list in sync with that workflow.
 *
 * Scopes follow the architecture in design/PLAN.md §2.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        // foundations
        'theme', // src/theme — tokens, typography, platform divergences
        'ui', // src/components/ui — primitives, no business logic
        'lib', // src/lib — loan-math, format, secure-pin, biometrics, haptics
        'state', // src/state — contexts, persistence
        'api', // src/api — interfaces, mock adapter, fixtures
        'data', // src/data — faq.ts, chat-scripts.ts

        // features (src/features/*, phases 3-7)
        'enrolment',
        'session',
        'loans',
        'repayment',
        'support',
        'account',

        // infrastructure
        'app', // src/app — route tree, layouts, guards
        'dev', // demo overlay, kitchen sink, scenarios
        'native', // ios/, android/, prebuild, config plugins
        'build', // app.json, eas.json, profiles, versioning
        'config', // tsconfig, eslint, metro, babel
        'deps',
        'test', // jest, RNTL, setup mocks
        'e2e', // .maestro flows
        'ci', // .github, workflows, commit/PR tooling
      ],
    ],
    // Scope is optional, but must be from the list above when present.
    'scope-empty': [0],
    'body-max-line-length': [1, 'always', 100],
  },
};
