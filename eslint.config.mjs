import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      semi: ['error', 'always'], // Enforce the use of semicolons
      'no-extra-semi': 'error', // Disallow unnecessary semicolons
      'react/prop-types': 'off', // Disable prop-types validation
      quotes: ['error', 'single', { allowTemplateLiterals: true }], // Enforce single quotes, allow double quotes in template literals
    },
  },
];

export default eslintConfig;