import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
    stories: ['../stories/**/*.stories.tsx', '../stories/*.stories.tsx', '../stories/*.stories.js'],

    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },

    docs: {
        autodocs: 'tag',
    },

    addons: ['@storybook/addon-webpack5-compiler-babel', '@chromatic-com/storybook'],
};

export default config;
