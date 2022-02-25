const { defineConfig } = require('cypress')

module.exports = defineConfig({
  component: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {},
    specPattern: 'src/**/*spec.{js,tsx}',
  },
})