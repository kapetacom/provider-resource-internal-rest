const Path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        'rest.blockware.com/v1/API': Path.resolve(__dirname, "./src/web/RESTAPIConfig.ts"),
        'rest.blockware.com/v1/Client': Path.resolve(__dirname, "./src/web/RESTClientConfig.ts")
    },
    output: {
        path: Path.join(process.cwd(), 'web'),
        filename: '[name].js',
        library: `Blockware.resourceTypes["[name]"]`,
        libraryTarget: 'assign'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        "@babel/env",
                        "@babel/typescript",
                        "@babel/react"
                    ],
                    plugins: [
                        ["@babel/plugin-proposal-decorators", {legacy: true} ],
                        ["@babel/plugin-proposal-class-properties", { loose: true }],
                        "@babel/proposal-object-rest-spread"
                    ]
                }
            },
            {
                test: /\.less$/,
                loaders: ["style-loader", "css-loader", "less-loader"],
                include: Path.resolve(__dirname, "./")
            },
            {
                test: /\.ya?ml$/,
                loaders: ['json-loader', 'yaml-loader'],
                include: Path.resolve(__dirname, "./")
            }
        ]
    },
    resolve: {
        extensions: [
            '.js',
            '.ts',
            '.tsx',
            '.less',
            '.yml',
            '.yaml'
        ]
    },
    externals: {
        react: 'React',
        'mobx-react': 'MobXReact',
        'mobx': 'MobX',
        'lodash': '_',
        '@blockware/ui-web-components': 'Blockware.Components',
        '@blockware/ui-web-types': 'Blockware.Types'
    }
};