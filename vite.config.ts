import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin, UserConfig } from 'vite';


// Read dynamic app version from package.json
const pkgPath = path.resolve(process.cwd(), 'package.json');
let appVersion = '2.5.4';
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (pkg.version) {
    appVersion = pkg.version;
  }
} catch {
  // fallback to default
}

const buildTime = Date.now();

function versionEmitterPlugin(): Plugin {
  const versionData = JSON.stringify(
    {
      version: appVersion,
      buildTime,
      buildDate: new Date(buildTime).toISOString(),
      appName: 'SIYANKES - KESDAM XVII/CENDERAWASIH',
      edition: 'Edisi Loreng Malvinas Taktis Terverifikasi - 3D Glass Emblem & Auto-Update',
    },
    null,
    2
  );

  return {
    name: 'siyankes-version-emitter',
    buildStart() {
      try {
        const publicDir = path.resolve(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(path.resolve(publicDir, 'version.json'), versionData);
      } catch (err) {
        console.warn('Could not write public/version.json:', err);
      }
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionData,
      });
    },
  };
}

function suppressHmrErrorsPlugin(): Plugin {
  return {
    name: 'suppress-hmr-errors',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [
          {
            tag: 'script',
            attrs: { type: 'text/javascript' },
            children: `(function() {
  window.addEventListener('error', function(e) {
    if (e && (e.message?.includes('WebSocket') || e.message?.includes('createWebSocketModuleRunnerTransport') || e.filename?.includes('@vite/client') || (e.error && String(e.error).includes('WebSocket')))) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);
  window.addEventListener('unhandledrejection', function(e) {
    if (e && (String(e.reason).includes('WebSocket') || String(e.reason).includes('@vite/client'))) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
  var OriginalWebSocket = window.WebSocket;
  if (OriginalWebSocket) {
    window.WebSocket = function(url, protocols) {
      var ws = new OriginalWebSocket(url, protocols);
      ws.addEventListener('error', function(event) {
        event.stopPropagation();
      });
      return ws;
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
  }
})();`,
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

export default defineConfig((): UserConfig => {
  return {
    plugins: [suppressHmrErrorsPlugin(), react(), tailwindcss(), versionEmitterPlugin()],
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(buildTime),
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      hmr: false,
      watch: null,
      allowedHosts: true,
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});

