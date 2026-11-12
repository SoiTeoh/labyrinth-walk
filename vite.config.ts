import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 相对路径，部署到 GitHub Pages 子路径时无需修改
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
