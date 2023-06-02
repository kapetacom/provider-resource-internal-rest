const Path = require('path');
const packageJson = require('./package.json');

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
                        ['@babel/plugin-proposal-decorators', {legacy: true}],
                        ['@babel/plugin-proposal-private-methods', {loose: true}],
                        ['@babel/plugin-proposal-private-property-in-object', {loose: true}],

                        ['@babel/plugin-proposal-class-properties', {loose: true}],
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
    },
    externals: {
        react: 'React',
        'mobx-react': 'MobXReact',
        mobx: 'MobX',
        lodash: '_',
        '@kapeta/ui-web-components': 'Kapeta.Components',
        '@kapeta/ui-web-types': 'Kapeta.Types',
    },
};
