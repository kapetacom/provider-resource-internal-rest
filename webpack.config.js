const Path = require('path');
const packageJson = require('./package.json');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        [`kapeta/resource-type-rest-api:${packageJson.version}`]: {
            import: Path.resolve(__dirname, './src/web/RESTAPIConfig.ts'),
            filename: `kapeta/resource-type-rest-api.js`,
        },
        [`kapeta/resource-type-rest-client:${packageJson.version}`]: {
            import: Path.resolve(__dirname, './src/web/RESTClientConfig.ts'),
            filename: `kapeta/resource-type-rest-client.js`,
        },
    },
    output: {
        path: Path.join(process.cwd(), 'web'),
        filename: '[name].js',
        library: {
            name: `Kapeta.resourceTypes["[name]"]`,
            type: 'assign',
            export: 'default',
        },
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'babel-loader',
                options: {
                    sourceMaps: true,
                    presets: ['@babel/env', '@babel/typescript', '@babel/react'],
                    plugins: [
                        ['@babel/plugin-proposal-decorators', { legacy: true }],
                        ['@babel/plugin-proposal-private-methods', { loose: true }],
                        ['@babel/plugin-proposal-private-property-in-object', { loose: true }],

                        ['@babel/plugin-proposal-class-properties', { loose: true }],
                        '@babel/proposal-object-rest-spread',
                    ],
                },
            },
            {
                test: /\.css/,
                use: ['style-loader', 'css-loader'],
                include: Path.resolve(__dirname, './'),
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader'],
                include: Path.resolve(__dirname, './'),
            },
            {
                test: /\.ya?ml$/,
                use: ['json-loader', 'yaml-loader'],
                include: Path.resolve(__dirname, './'),
            },
        ],
    },
    devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'inline-source-map',
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.less', '.yml', '.yaml'],
        fallback: {
            path: require.resolve('path-browserify'),
        },
    },
    externals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        lodash: '_',
        '@mui/material': {
            commonjs: '@mui/material',
            commonjs2: '@mui/material',
            amd: '@mui/material',
            root: '@mui/material',
        },
        '@mui/icons-material': {
            commonjs: '@mui/icons-material',
            commonjs2: '@mui/icons-material',
            amd: '@mui/icons-material',
            root: '@mui/icons-material',
        },
        '@emotion/react': {
            commonjs: '@emotion/react',
            commonjs2: '@emotion/react',
            amd: '@emotion/react',
            root: '@emotion/react',
        },
        '@emotion/styled': {
            commonjs: '@emotion/styled',
            commonjs2: '@emotion/styled',
            amd: '@emotion/styled',
            root: '@emotion/styled',
        },
        '@kapeta/ui-web-components': 'Kapeta.Components',
        '@kapeta/ui-web-types': 'Kapeta.Types',
        '@kapeta/ui-web-utils': 'Kapeta.Utils',
        '@kapeta/ui-web-context': 'Kapeta.Context',
    },
    plugins: [new BundleAnalyzerPlugin()],
};
