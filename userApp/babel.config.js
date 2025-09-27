// frontend/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Pass jsxImportSource to the Expo preset
      ['babel-preset-expo', { 
        jsxImportSource: 'nativewind',
        unstable_transformImportMeta: true // Enable import.meta polyfill
      }],
      // NativeWind v4 uses a PRESET (not a plugin)
      'nativewind/babel',
    ],
    plugins: [
      ["module:react-native-dotenv", {
        "envName": "APP_ENV",
        "moduleName": "@env",
        "path": ".env",
        "safe": false,
        "allowUndefined": true,
        "verbose": false
      }]
    ]
  };
};
