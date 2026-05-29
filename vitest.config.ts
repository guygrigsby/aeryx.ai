import { defineConfig } from 'vitest/config';

// Plain Vitest config (not Astro's getViteConfig): the test suite only imports
// pure `.ts` modules, never `.astro` components, so the Astro wrapper adds no
// value and fails to load its config under Vitest 2.x.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
