/**
 * Generate the PWA icon PNGs (192x192 and 512x512) and favicon.ico.
 *
 * Uses a hand-written minimal PNG encoder so the project needs no image
 * dependency. Run with: node scripts/generate-icons.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ICON_DIR = resolve(ROOT, 'public/icons');

// Brand colours matching St. Peter's Hostel Coral Palette
const CORAL_ORANGE = [0xff, 0x5a, 0x36];
const SLATE_LIGHT = [0xf8, 0xfa, 0xfc];
const WHITE = [0xff, 0xff, 0xff];

/** CRC32, needed for PNG chunk checksums. */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

/**
 * Encode RGBA pixel data as a PNG.
 * @param {number} size
 * @param {Uint8Array} rgba - size*size*4 bytes
 * @returns {Buffer}
 */
function encodePNG(size, rgba) {
  // Each scanline is prefixed with a filter byte (0 = none)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.subarray(y * size * 4, (y + 1) * size * 4).forEach((byte, i) => {
      raw[y * (size * 4 + 1) + 1 + i] = byte;
    });
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Draw the app icon: a terracotta rounded square with a cream storefront
 * mark — an awning over a shop front, matching the hostel's palette.
 * @param {number} size
 * @returns {Uint8Array}
 */
function drawIcon(size) {
  const px = new Uint8Array(size * size * 4);
  const s = (v) => Math.round(v * size); // fractional → pixel

  const radius = s(0.22);
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = a;
  };

  // Rounded-square background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);
      let inside = true;
      if (dx < radius && dy < radius) {
        const ddx = radius - dx;
        const ddy = radius - dy;
        inside = ddx * ddx + ddy * ddy <= radius * radius;
      }
      if (inside) set(x, y, CORAL_ORANGE);
    }
  }

  const rect = (x0, y0, x1, y1, color) => {
    for (let y = Math.round(y0); y < Math.round(y1); y++) {
      for (let x = Math.round(x0); x < Math.round(x1); x++) set(x, y, color);
    }
  };

  // Awning band
  rect(s(0.22), s(0.3), s(0.78), s(0.4), SLATE_LIGHT);

  // Awning scallops — alternating white notches
  const scallops = 4;
  const bandW = s(0.78) - s(0.22);
  for (let i = 0; i < scallops; i++) {
    const x0 = s(0.22) + (bandW / scallops) * i;
    const x1 = x0 + bandW / scallops / 2;
    rect(x0, s(0.3), x1, s(0.4), WHITE);
  }

  // Shop body
  rect(s(0.26), s(0.4), s(0.74), s(0.72), SLATE_LIGHT);

  // Doorway
  rect(s(0.43), s(0.52), s(0.57), s(0.72), CORAL_ORANGE);

  // Ground line
  rect(s(0.2), s(0.72), s(0.8), s(0.76), SLATE_LIGHT);

  return px;
}

mkdirSync(ICON_DIR, { recursive: true });

for (const size of [192, 512]) {
  const png = encodePNG(size, drawIcon(size));
  writeFileSync(resolve(ICON_DIR, `icon-${size}x${size}.png`), png);
  console.log(`Wrote icons/icon-${size}x${size}.png (${png.length} bytes)`);
}

// favicon.ico — a single 32x32 PNG wrapped in an ICO container
const faviconSize = 32;
const faviconPng = encodePNG(faviconSize, drawIcon(faviconSize));
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); // reserved
ico.writeUInt16LE(1, 2); // type: icon
ico.writeUInt16LE(1, 4); // image count
ico[6] = faviconSize;
ico[7] = faviconSize;
ico[8] = 0; // palette
ico[9] = 0; // reserved
ico.writeUInt16LE(1, 10); // colour planes
ico.writeUInt16LE(32, 12); // bits per pixel
ico.writeUInt32LE(faviconPng.length, 14);
ico.writeUInt32LE(22, 18); // offset of the image data

writeFileSync(resolve(ROOT, 'public/favicon.ico'), Buffer.concat([ico, faviconPng]));
console.log(`Wrote favicon.ico (${22 + faviconPng.length} bytes)`);
