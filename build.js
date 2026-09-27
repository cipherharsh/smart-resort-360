const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Smart Resort 360 Build for Vercel ---');

const frontendDir = path.join(__dirname, 'frontend');

console.log('1. Installing frontend dependencies...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('2. Building Vite frontend bundle...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

const srcDist = path.join(frontendDir, 'dist');
const rootDist = path.join(__dirname, 'dist');

console.log('3. Copying build artifacts from frontend/dist to root dist...');
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(srcDist)) {
  copyRecursive(srcDist, rootDist);
  console.log('✓ Successfully populated root dist directory with index.html & assets!');
} else {
  console.error('ERROR: frontend/dist not found!');
  process.exit(1);
}

console.log('--- Smart Resort 360 Build Completed Successfully ---');
