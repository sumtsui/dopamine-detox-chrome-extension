module.exports = {
  extends: 'eslint:recommended',
  env: {
    browser: true,
    es2020: true,
  },
  globals: {
    chrome: 'readonly', // for Chrome plugin
  },
  reportUnusedDisableDirectives: true,
  ignorePatterns: ['build/', 'node_modules/'],
  root: true,
  rules: {
    'indent': ['error', 2],
    'keyword-spacing': 2,
    'no-unused-vars': 'warn',
    'quote-props': ['error', 'consistent-as-needed'],
    'semi': 'warn',
    'no-undef': 'error',
    'no-global-assign': 'error',
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'only-multiline'],
    'eqeqeq': ['error', 'always'],
    'no-unused-expressions': [
      'warn',
      {
        allowTaggedTemplates: true,
        allowTernary: true,
        allowShortCircuit: true,
      },
    ],
    'no-console': 0,
  },
};
