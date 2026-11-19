const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: 'clientes.spec.js',
  workers: 1,
  reporter: 'list',

  use: {
    headless: false,
    video: 'on',
    screenshot: 'on',
    trace: 'on'
  },

  outputDir: 'test-results/'
});