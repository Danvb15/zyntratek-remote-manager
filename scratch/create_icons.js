import fs from 'fs';
import path from 'path';

const iconsDir = path.resolve('src-tauri/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Minimal valid PNG base64 (1x1 red pixel)
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAOSURBVFiW2mNk+M9AOwAAMgECAQ/8x4AAAAAASUVORK5CYII=";
const pngBuffer = Buffer.from(base64Png, 'base64');

fs.writeFileSync(path.join(iconsDir, '32x32.png'), pngBuffer);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), pngBuffer);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), pngBuffer);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), pngBuffer);

// Basic ICO header for 1 image: 6 bytes header + 16 bytes directory entry + PNG payload
const icoHeader = Buffer.from([
  0, 0,             // Reserved
  1, 0,             // ICO type (1 = ICO)
  1, 0,             // Number of images (1)
  32,               // Width (32px)
  32,               // Height (32px)
  0,                // Color palette (0 = no palette)
  0,                // Reserved
  1, 0,             // Color planes (1)
  32, 0,            // Bits per pixel (32)
  ...new Uint8Array(new Uint32Array([pngBuffer.length]).buffer), // Image size
  22, 0, 0, 0       // Offset to image data (22)
]);

const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);

console.log("Icons created successfully in src-tauri/icons/");
