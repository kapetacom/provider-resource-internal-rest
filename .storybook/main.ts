import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
    stories: ['../stories/**/*.stories.tsx', '../stories/*.stories.tsx'],

    framework: {
        name: '@storybook/react-webpack5',
        options: {},
    },

    addons: ['@storybook/addon-essentials', '@storybook/addon-webpack5-compiler-babel', '@chromatic-com/storybook'],
};

export default config;
