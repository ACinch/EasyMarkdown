const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/renderer/renderer.ts'],
  bundle: true,
  outfile: 'dist/renderer/renderer.js',
  platform: 'browser',
  format: 'iife',
  target: 'chrome120',
}).catch(() => process.exit(1));
