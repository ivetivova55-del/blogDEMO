import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src',
  envDir: '..',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        dashboard: resolve(__dirname, 'src/dashboard.html'),
        projects: resolve(__dirname, 'src/projects.html'),
        admin: resolve(__dirname, 'src/admin.html'),
        taskDetails: resolve(__dirname, 'src/task-details.html'),
        faq: resolve(__dirname, 'src/faq.html'),
        contact: resolve(__dirname, 'src/contact.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
