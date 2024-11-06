const path = require("path");
const JavaScriptObfuscator = require("webpack-obfuscator");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./index.js",
  target: "node",
  mode: "production",
  stats: {
    warningsFilter: /Critical dependency/,
  },
  ignoreWarnings: [/Critical dependency/],
  output: {
    path: path.resolve(__dirname, "export"),
    filename: "bundle.js",
    libraryTarget: "commonjs2",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    modules: [path.resolve(__dirname, "node_modules")],
  },
  externals: {
    bcrypt: "commonjs bcrypt",
    "body-parser": "commonjs body-parser",
    cors: "commonjs cors",
    "crypto-js": "commonjs crypto-js",
    express: "commonjs express",
    "express-rate-limit": "commonjs express-rate-limit",
    jsonwebtoken: "commonjs jsonwebtoken",
    level: "commonjs level",
    leveldown: "commonjs leveldown",
    levelup: "commonjs levelup",
    multer: "commonjs multer",
    "pdf-to-printer": "commonjs pdf-to-printer",
    xlsx: "commonjs xlsx",
    "@babel/core": "commonjs @babel/core",
    "@babel/preset-env": "commonjs @babel/preset-env",
    "babel-loader": "commonjs babel-loader",
    puppeteer: "commonjs puppeteer",
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console statements
          },
          mangle: true, // Mangle variable names
          output: {
            comments: false, // Remove comments
          },
        },
      }),
    ],
  },
  plugins: [
    new JavaScriptObfuscator(
      {
        rotateUnicodeArray: true,
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.9, // Higher threshold
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: true,
        disableConsoleOutput: true,
        identifiersGenerator: "mangled",
        selfDefending: true,
        sourceMap: false,
        stringArray: true, // Use string array
        stringArrayThreshold: 0.75, // High threshold for string array
      },
      ["bundle.js"]
    ),
  ],
};
