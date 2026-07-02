import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Raise the warning threshold — 2MB chunks are expected with export libs
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── Export libraries → their own chunk (loaded only on download) ──
          if (
            id.includes('jspdf') ||
            id.includes('jsPDF')
          ) return 'chunk-jspdf';

          if (id.includes('pptxgenjs')) return 'chunk-pptx';

          if (
            id.includes('docx') &&
            !id.includes('node_modules/react')
          ) return 'chunk-docx';

          if (
            id.includes('xlsx') ||
            id.includes('sheetjs')
          ) return 'chunk-xlsx';

          if (id.includes('jszip')) return 'chunk-jszip';

          if (id.includes('html2canvas')) return 'chunk-html2canvas';

          if (id.includes('mammoth')) return 'chunk-mammoth';

          if (id.includes('puppeteer')) return 'chunk-puppeteer';

          // ── KaTeX → own chunk (math rendering) ──
          if (
            id.includes('katex') ||
            id.includes('rehype-katex') ||
            id.includes('remark-math')
          ) return 'chunk-katex';

          // ── Markdown rendering ──
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype') ||
            id.includes('hast') ||
            id.includes('mdast') ||
            id.includes('unified') ||
            id.includes('micromark') ||
            id.includes('vfile')
          ) return 'chunk-markdown';

          // ── Framer Motion / Motion ──
          if (
            id.includes('framer-motion') ||
            id.includes('/motion/')
          ) return 'chunk-motion';

          // ── Supabase ──
          if (id.includes('@supabase')) return 'chunk-supabase';

          // ── i18n ──
          if (
            id.includes('i18next') ||
            id.includes('react-i18next')
          ) return 'chunk-i18n';

          // ── React core ──
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) return 'chunk-react';

          // ── Lucide icons ──
          if (id.includes('lucide-react')) return 'chunk-icons';

          // ── Router ──
          if (id.includes('react-router')) return 'chunk-router';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
