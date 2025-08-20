const webpack = require("webpack");
const { execSync } = require("child_process");

const is_webapp = Boolean(process.env.ASSET_PACK_HREF);

module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: {
        minSize: 10000,
        maxSize: 250000
      }
    },
    devServer: {
      stats: {
        chunks: false,
        chunkModules: false,
        modules: false
      },
      port: process.env.WEB_PORT || 8413
    },
    // devtool: "source-map",
    devtool: "eval-source-map",
    resolve: {
      alias: {
        // Include the vue compiler so mods can use templates
        vue$: "vue/dist/vue.esm.js",
        "@/*": "./src/*",
        // "IpcRenderer$": '/src/js/ipcRendererAlias.js'
        Logger$: is_webapp ? "/webapp/logPolyfill.js" : "electron-log",
        IpcRenderer$: is_webapp
          ? "/webapp/fakeIpc.js"
          : "/src/js/ipcRendererAlias.js",
        "electron-store$": is_webapp
          ? "/webapp/storePolyfill.js"
          : "electron-store"
      }
    },
    plugins: [],
    module: {
      rules: [
        {
          test: /\.(?:js|mjs|cjs)$/,
          exclude: {
            and: [/node_modules/], // Exclude libraries in node_modules ...
            not: [
              // Except for a few of them that needs to be transpiled because they use modern syntax
              /vue-reader/,
              /typescript-etw/
            ]
          },
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: "defaults"
                  }
                ]
              ],
              plugins: [
                "@babel/plugin-transform-nullish-coalescing-operator",
                "@babel/plugin-transform-optional-chaining"
              ]
            }
          }
        },
        {
          test: /\.node$/,
          loader: "node-loader"
        }
      ]
    }
  },
  chainWebpack: config => {
    if (process.env.ASSET_PACK_HREF) {
      console.log("Replacing for asset href", process.env.ASSET_PACK_HREF);
      const srl_options = options => {
        return {
          search: "assets://",
          replace: process.env.ASSET_PACK_HREF,
          flags: "g"
        };
      };
      // config.module.rule('vue')
      //     .use('string-replace-loader')
      //     .loader('string-replace-loader')
      //     .before('cache-loader') // After css imports are resolved
      //     .tap(srl_options)

      for (const rule of ["css", "scss"]) {
        for (const oneOfCase of [
          "vue",
          "vue-modules",
          "normal",
          "normal-modules"
        ]) {
          // console.warn(oneOfCase)
          config.module
            .rule(rule)
            .oneOf(oneOfCase)
            .use("string-replace-loader")
            .loader("string-replace-loader")
            .before("css-loader") // After css-loader processes imports (before means after)
            .tap(srl_options);
        }
      }
    }
  }
};
