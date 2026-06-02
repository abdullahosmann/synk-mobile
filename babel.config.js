module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-configures the Reanimated/Worklets plugin in SDK 56,
    // so no manual worklets plugin is needed here.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
