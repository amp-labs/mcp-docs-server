import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts', // Adjust this path if your entry point is different
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        '@mintlify/openapi-parser',
        '@mintlify/validation',
        '@modelcontextprotocol/sdk',
        'axios',
        'dashify',
        'dotenv',
        'trieve-ts-sdk'
      ]
    },
    outDir: 'dist',
    sourcemap: true,
    minify: true
  }
}); 