import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/admin-api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/admin-api/, '/admin'),
            target: 'http://127.0.0.1:8080',
            ws: true,
          },
        },
      },
    },
  };
});
