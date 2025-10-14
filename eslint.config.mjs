// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base recommended rules
  js.configs.recommended,

  // Project settings
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // Tweak or add rules as you like:
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-constant-condition': ['warn', { checkLoops: false }]
    }
  }
];

