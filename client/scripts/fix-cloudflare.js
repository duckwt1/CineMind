const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const oldPath = path.join(distDir, 'assets', 'node_modules');
const newPath = path.join(distDir, 'assets', 'vendor_modules');

if (fs.existsSync(oldPath)) {
  if (fs.existsSync(newPath)) {
    fs.rmSync(newPath, { recursive: true, force: true });
  }
  fs.renameSync(oldPath, newPath);
  console.log('[fix-cloudflare] Renamed dist/assets/node_modules -> dist/assets/vendor_modules');

  function replaceInFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        replaceInFiles(fullPath);
      } else if (
        file.name.endsWith('.js') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.json')
      ) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('/assets/node_modules') || content.includes('assets/node_modules')) {
          content = content.replaceAll('/assets/node_modules', '/assets/vendor_modules');
          content = content.replaceAll('assets/node_modules', 'assets/vendor_modules');
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log('[fix-cloudflare] Patched:', file.name);
        }
      }
    }
  }

  replaceInFiles(distDir);
  console.log('[fix-cloudflare] Successfully fixed all asset paths for Cloudflare Pages.');
} else {
  console.log('[fix-cloudflare] No dist/assets/node_modules directory found.');
}
