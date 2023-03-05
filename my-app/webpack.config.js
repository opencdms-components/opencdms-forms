const path = require('path');
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
        loader: 'vuetify-loader'
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
      }
    ]
  },
  plugins: [ new VuetifyLoaderPlugin() ]
};