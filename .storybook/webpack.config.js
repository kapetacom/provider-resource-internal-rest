
module.exports = ({config}) => {

    config.module.rules = config.module.rules.concat([
        {
            test: /\.(ts|tsx)$/,
            loader: 'babel-loader',
            options: {
                sourceMaps: true,
                presets: [
                    "@babel/env",
                    "@babel/typescript",
                    "@babel/react"
                ],
                plugins: [
                    ["@babel/plugin-proposal-decorators", {legacy: true}],
                    ["@babel/plugin-proposal-private-methods", { "loose": true }],
                    ["@babel/plugin-proposal-private-property-in-object", {"loose": true}],

                    [
                        "@babel/plugin-proposal-class-properties", {loose: true}
                    ],
                    "@babel/proposal-object-rest-spread"
                ]
            }
        },
        {
            test: /\.less$/,
            use: ["style-loader", "css-loader", "less-loader"]
        },
        {
            test: /\.ya?ml$/,
            use: ['json-loader', 'yaml-loader']
        },

    ]);

    return config;
};