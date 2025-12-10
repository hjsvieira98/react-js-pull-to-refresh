import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// Check if we're building for debug
const isDebug = process.env.BUILD_MODE === 'debug';

export default defineConfig(({ mode }) => ({
  mode: isDebug ? 'development' : mode,
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactEasyPullRefresh',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    // Disable minification and keep code readable for debug builds
    minify: isDebug ? false : 'esbuild',
    // Generate source maps for better debugging
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        // Keep original names and formatting for better debugging
        ...(isDebug && {
          compact: false,
          generatedCode: {
            constBindings: false,
            objectShorthand: false,
          },
        }),
      },
      // Disable tree-shaking for debug builds to keep all code
      ...(isDebug && {
        treeshake: false,
      }),
    },
  },
}));

