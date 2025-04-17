import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs', '.json'],
  },
  plugins: [tsconfigPaths()],
});
