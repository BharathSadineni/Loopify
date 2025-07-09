const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/renderer.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'renderer.bundle.js',
    },
    target: 'electron-renderer',
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    devtool: 'source-map',
};
