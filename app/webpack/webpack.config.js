const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    // mode can be eventually changed to "prod"
    mode: 'development',
    optimization: {
        // Allegedly removes unused code, called tree-shaking
        usedExports: true,
    },
    entry: path.resolve(__dirname, "src/script", "main.js"),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    // Include index.html file in bundle (./dist)
    plugins: [new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "src", "index.html")
        }),
    ],
    // Enables loading of CSS in js files
    module: {
        rules: [
            { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
        ],
    },
    devServer: {
        host: '0.0.0.0',
        port: '80',
        client: {
            webSocketURL: {
                hostname: "localhost",
                port: 8080,
                protocol: "ws",
            },
        },
    }
};