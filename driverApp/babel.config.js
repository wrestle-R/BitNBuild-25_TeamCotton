// frontend/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Pass jsxImportSource to the Expo preset
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      // NativeWind v4 uses a PRESET (not a plugin)
      'nativewind/babel',
    ],
  };
};
