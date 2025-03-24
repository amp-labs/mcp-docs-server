import { defineConfig } from "vite";
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  server: {
    port: 3001
  },
  build: {
    outDir: './dist',
    lib: {
      entry: './src/index.ts',
      formats: ['cjs'],
      fileName: (format) => `index.${format}`
    },
    rollupOptions: {
      external: ['express', 'dotenv', 'zod', 'trieve-ts-sdk', 'axios', 'dashify', 'mintlify-validation', 'mintlify-openapi-parser']
    },
    sourcemap: true,
    target: 'node16'
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',

      // tell the plugin where is your project entry
      appPath: './src/index.ts',

      // Optional, default: 'viteNodeApp'
      // the name of named export of you app from the appPath file
      exportName: 'mcpApp',

      // Optional, default: false
      // if you want to init your app on boot, set this to true
      initAppOnBoot: true,
    })
  ],
});
