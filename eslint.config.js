import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default tseslint.config(
  { ignores: ['storybook-static', 'node_modules', 'src/tokens.json'] },
  { files: ['**/*.{ts,tsx,js,mjs}'], extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': hooks }, rules: { ...hooks.configs.recommended.rules } },
);
