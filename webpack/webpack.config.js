const path = require('path');

module.exports = {
  entry: path.resolve('Extensions/Chrome/popup.js'),
  output: {
    path: path.resolve('Extensions/Chrome/dist'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.sass$/,
        loaders: ['style', 'css', 'sass']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: [ 'es2015', 'react' ]
        }
      }
    ]
  }
};
