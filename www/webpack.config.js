//const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: "./src/bootstrap.ts",

  plugins: [
    new HtmlWebpackPlugin({
      title: "Nywer"
    })
  ],

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    clean: true
  },

  mode: "development",
  devtool: "source-map", //change this to empty for prod
  devServer: { host: "0.0.0.0" },
  experiments: {
    syncWebAssembly: true
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js"]
  },

  module: {
    rules: [
      { test: /\.(woff|woff2|eot|ttf|otf|csv)$/, use: ["file-loader"], },
      { test: /\.tsx?$/, use: "ts-loader" },

      { test: /\.js$/, loader: "source-map-loader" },

      { test: /\.css$/, use: ['style-loader', 'css-loader'] },

      { test: /\.(png|svg|jpg|gif)$/, use: ['file-loader'] },
    ]
  },

  // plugins: [
  //   new CopyWebpackPlugin({
  //     patterns: ['index.html']
  //   })
  // ],
};
