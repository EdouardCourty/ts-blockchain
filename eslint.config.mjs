// @ts-check

import tseslint from 'typescript-eslint';

export default tseslint.config(
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    {
        rules: {
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/no-explicit-any": "off"
        },
        files: ['src/**/*.ts', 'tests/**/*.ts'],
    },
);
