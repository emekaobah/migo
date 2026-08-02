// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'ios/*', 'android/*'],
  },
  {
    // Token discipline (PLAN §3.1). Across 21 screens the most likely drift is a
    // one-off hex literal that nobody notices until the design review. The token
    // table in src/theme is the contract; everything else imports from it.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            'No hex colours outside src/theme. Import the token instead — see src/theme/tokens.ts.',
        },
        {
          selector: String.raw`Literal[value=/^rgba?\(/]`,
          message:
            'No rgb()/rgba() literals outside src/theme. Use the onNavy overlays in src/theme/tokens.ts.',
        },
      ],
    },
  },
]);
