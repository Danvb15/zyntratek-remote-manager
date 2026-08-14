import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

function createPng(width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);
  
  // Raw image data: height rows, each with 1 filter byte (0) + width * 4 bytes (RGBA)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const idx = 1 + x * 4;
      row[idx] = 99;    // Red
      row[idx + 1] = 102; // Green
      row[idx + 2] = 241; // Blue
      row[idx + 3] = 255; // Alpha
    }
    rawRows.push(row);
  }
  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  
  const iend = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const iconsDir = path.resolve('src-tauri/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const png32 = createPng(32, 32);
const png128 = createPng(128, 128);

fs.writeFileSync(path.join(iconsDir, '32x32.png'), png32);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), png128);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), png128);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), png128);

// Make ICO with png32
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);

const icoEntry = Buffer.alloc(16);
icoEntry[0] = 32; // Width
icoEntry[1] = 32; // Height
icoEntry[2] = 0;  // Colors
icoEntry[3] = 0;  // Reserved
icoEntry.writeUInt16LE(1, 4); // Planes
icoEntry.writeUInt16LE(32, 6); // BPP
icoEntry.writeUInt32LE(png32.length, 8); // Size
icoEntry.writeUInt32LE(22, 12); // Offset

const icoFile = Buffer.concat([icoHeader, icoEntry, png32]);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoFile);

console.log("Valid PNG & ICO files created!");
