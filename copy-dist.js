const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

const src = path.join(__dirname, 'frontend', 'dist');
const dest = path.join(__dirname, 'dist');
if (fs.existsSync(src)) {
  copyFolderSync(src, dest);
  console.log('Successfully copied frontend/dist to root dist for Vercel');
} else {
  console.error('Source directory frontend/dist not found');
}
