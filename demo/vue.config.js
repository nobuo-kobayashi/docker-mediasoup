const { defineConfig } = require('@vue/cli-service')
const fs = require('fs')
module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    server: {
      type: 'https',
      options: {
        key: fs.readFileSync("../certs/server.key"),
        cert: fs.readFileSync("../certs/server.crt"),
      }
    }
  },

  pluginOptions: {
    vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		}
  },

  configureWebpack: {
    // watch: true,
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 500,
      poll: 1000
    }
  }
})
