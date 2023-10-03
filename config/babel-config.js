module.exports = (api) => ({
  presets: [
    ["@babel/preset-typescript"],
    [
      "@babel/preset-env",
      {
        modules: api.env() !== "esm" && "commonjs",
        loose: false,
        useBuiltIns: false,
      },
    ],
  ],
  ignore: [/@babel[\\|/]runtime/],
});
