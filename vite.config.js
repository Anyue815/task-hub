import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Pages 部署在 https://<用户名>.github.io/<仓库名>/ 下，必须设置 base。
// 本地开发时 GITHUB_REPOSITORY 不存在，base 为 '/'，和以前完全一样；
// 在 GitHub Actions 里会自动变成 '/<仓库名>/'，不用手改。
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]

// GitHub Pages 不支持 SPA 路由回退：刷新 /login 会返回 404。
// 把 index.html 复制一份成 404.html，刷新时仍能回到应用里。
function spa404Fallback() {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const from = path.resolve('dist/index.html')
      const to = path.resolve('dist/404.html')
      if (fs.existsSync(from)) fs.copyFileSync(from, to)
    }
  }
}

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [
    vue(),
    tailwindcss(), // 激活 Tailwind v4 引擎
    viteCompression({
      threshold: 10240, // 超过 10kb 的文件才压缩
      algorithm: 'gzip',
      ext: '.gz'
    }),
    spa404Fallback()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 将 vue 相关库打包在一起（Vite 8 / Rolldown 只支持函数写法）
        manualChunks(id) {
          if (/node_modules[\\/](vue|vue-router|pinia|@vue)/.test(id)) {
            return 'vue-vendor'
          }
        }
      }
    }
  }
})
