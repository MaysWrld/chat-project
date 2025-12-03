import { defineConfig } from 'vite';

export default defineConfig({
  // 🚨 关键修正：告诉 Vite 根目录在 public 文件夹内
  root: 'public', 
  base: '/',
  build: {
    // Vite 会将 'public' 目录中的内容构建到 'dist' 目录中
    outDir: '../dist', // 输出目录需要调整到根目录的 dist 文件夹
    emptyOutDir: true
  }
});
