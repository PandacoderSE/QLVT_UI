import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Thư mục build
    assetsDir: 'assets', // Thư mục chứa tài nguyên
    rollupOptions: {
      input: {
        main: './index.html', // Điểm vào của ứng dụng
      },
    },
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
})
