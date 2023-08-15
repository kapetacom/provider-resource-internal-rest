module.exports = {
    extends: ['@kapeta/eslint-config'],
    env: {
        node: true,
    },
    parserOptions: {
        project: `${__dirname}/tsconfig.eslint.json`,
        tsconfigRootDir: __dirname,
    },
};
