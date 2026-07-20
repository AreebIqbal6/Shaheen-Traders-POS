import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import mkcert from 'vite-plugin-mkcert'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// https://vite.dev/config/

const backupMiddleware = async (req: any, res: any, next: any) => {
  if (req.url === '/api/save-backup' && req.method === 'POST') {
    // Needed because basicSsl might be used, we handle CORS just in case
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Collect data
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { basePath, dateStr, orderId, pdfBase64, excelBase64, sqlContent } = data;
        
        const safeBasePath = basePath.replace(/\//g, '\\');
        let finalBasePath = safeBasePath;
        let orderFolderPath = `${finalBasePath}\\SHAHEEN TRADERS BACKUP\\ORDER HISTORY\\${dateStr}\\${orderId}`;
        
        // Ensure directory exists with fallback to Desktop
        try {
          fs.mkdirSync(orderFolderPath, { recursive: true });
        } catch (err) {
          finalBasePath = `${os.homedir()}\\Desktop`;
          orderFolderPath = `${finalBasePath}\\SHAHEEN TRADERS BACKUP\\ORDER HISTORY\\${dateStr}\\${orderId}`;
          fs.mkdirSync(orderFolderPath, { recursive: true });
        }
        
        // Write PDF
        if (pdfBase64) {
           const pdfBuffer = Buffer.from(pdfBase64, 'base64');
           fs.writeFileSync(`${orderFolderPath}\\${orderId}.pdf`, pdfBuffer);
        }
        
        // Write Excel
        if (excelBase64) {
           const excelBuffer = Buffer.from(excelBase64, 'base64');
           fs.writeFileSync(`${orderFolderPath}\\${orderId}.xlsx`, excelBuffer);
        }
        
        // Write SQL
        if (sqlContent) {
           fs.writeFileSync(`${orderFolderPath}\\${orderId}.sql`, sqlContent, 'utf-8');
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, path: orderFolderPath }));
      } catch(e: any) {
        console.error('Save API Error:', e);
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }
  next();
};

export default defineConfig({
  resolve: {
    conditions: ['zbar-inlined']
  },
  server: {
    port: 5177,
    strictPort: true
  },
  plugins: [
    {
      name: 'local-backup-api',
      configureServer(server) {
        server.middlewares.use(backupMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(backupMiddleware);
      }
    },
    react(),
    // mkcert(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Shaheen Traders',
        short_name: 'Shaheen',
        description: 'Shaheen Traders POS and B2B Shop',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: './',
  build: {
    sourcemap: false, // Prevents generating original source code maps
    rollupOptions: {
      external: [
        /^@tauri-apps\/.*/
      ]
    },
    minify: 'terser',
    chunkSizeWarningLimit: 3000,
    terserOptions: {
      compress: {
        drop_console: true, // Completely strips all console.logs
        drop_debugger: true,
      },
      format: {
        comments: false, // Removes all comments
      }
    }
  }
})
