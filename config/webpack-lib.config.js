const path = require("node:path");
const AppRootPath = require("app-root-path");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  entry: path.join(AppRootPath.path, "src/index.ts"),
  output: {
    path: path.join(AppRootPath.path, "dist/umd"),
    filename: "vanilla-context-menu.min.js",
    library: "FlowUI",
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: "this",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
    ],
  },
  plugins: [
    new CompressionPlugin({
      filename: "[file].gz",
      algorithm: "gzip",
      test: /\.(js|css)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],
  optimization: {
    minimize: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  stats: "errors-only",
};
