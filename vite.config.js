import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages 项目站点运行在 /repo/ 子路径下，必须用相对路径
  base: './',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '拼豆图纸生成器 Perler Studio',
        short_name: '拼豆图纸',
        description: '上传图片或 AI 生成图案，一键转换为拼豆图纸，支持导出 PNG / 打印版 / 材料清单',
        lang: 'zh-CN',
        theme_color: '#002FA7',
        background_color: '#F4F5FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/open\.bigmodel\.cn\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2019',
    outDir: 'dist',
  },
})
