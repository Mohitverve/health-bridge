import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@ant-design/icons',
      '@ant-design/icons/es/icons/HospitalOutlined.js'
    ]
  }
});
