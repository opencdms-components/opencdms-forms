const path = require('path');
const { fileLoader } = require('file-loader');
const { VueLoaderPlugin } = require('vue-loader');
const { VuetifyLoaderPlugin } = require('vuetify-loader');

module.exports = {
  entry: './src/components.js',
  output: {
    filename: 'myComponents.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.sass$/,
        use: [
            'vue-style-loader',
            'css-loader',
            {
                loader: 'sass-loader',
                options: {
                    implementation: require('sass')
                }
            }
        ]
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets/',
            },
          },
        ],
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new VuetifyLoaderPlugin()
  ]
};