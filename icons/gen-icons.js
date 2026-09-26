/* 生成梦屿 App 图标（纯 Node + zlib，无依赖） */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ---------- PNG 编码 ---------- */
const CRC_TABLE = (function () {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- 绘制 ---------- */
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
function mix(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }

function drawIcon(S, outPath) {
  const px = Buffer.alloc(S * S * 4);
  const r = S * 0.22; // 圆角半径
  const bgTop = [43, 14, 31];    // #2b0e1f
  const bgBot = [109, 32, 80];   // #6d2050
  const hTop = [255, 179, 207];  // #ffb3cf 亮粉（突出于背景）
  const hBot = [255, 126, 179];  // #ff7eb3

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const cx = x + 0.5, cy = y + 0.5;
      let near = 0;
      // 圆角裁剪
      if (cx < r && cy < r) {
        const dx = r - cx, dy = r - cy;
        near = Math.sqrt(dx * dx + dy * dy);
        if (near > r) { px[i + 3] = 0; continue; }
      } else if (cx > S - r && cy < r) {
        const dx = cx - (S - r), dy = r - cy;
        near = Math.sqrt(dx * dx + dy * dy);
        if (near > r) { px[i + 3] = 0; continue; }
      } else if (cx > S - r && cy > S - r) {
        const dx = cx - (S - r), dy = cy - (S - r);
        near = Math.sqrt(dx * dx + dy * dy);
        if (near > r) { px[i + 3] = 0; continue; }
      } else if (cx < r && cy > S - r) {
        const dx = r - cx, dy = cy - (S - r);
        near = Math.sqrt(dx * dx + dy * dy);
        if (near > r) { px[i + 3] = 0; continue; }
      }
      const ty = y / S;
      let col = mix(bgTop, bgBot, ty);
      // 爱心：心形隐式曲线 (x²+y²-1)³ - x²y³ ≤ 0，曲线空间高度约 2.26 单位
      // 整体高度取 0.78S，心形中心放在 47% 高度处（为 maskable 安全区留出下缘）
      const n = (0.78 * S) / 2.26;
      const hx = (x - S / 2) / n;
      const hy = (y - S * 0.47) / n;
      const f = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
      if (f <= 0) {
        const ht = (hy + 1) / 2.26;
        col = mix(hTop, hBot, Math.max(0, Math.min(1, ht)));
      }
      px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255;
      if (near > 0) {
        const aa = Math.max(0, Math.min(1, r - near + 0.75));
        px[i + 3] = Math.round(255 * aa);
      }
    }
  }
  fs.writeFileSync(outPath, encodePNG(S, S, px));
  console.log('生成 ' + outPath + ' (' + S + 'x' + S + ')');
}

const dir = '/workspace/icons';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
drawIcon(180, path.join(dir, 'icon-180.png'));
drawIcon(192, path.join(dir, 'icon-192.png'));
drawIcon(512, path.join(dir, 'icon-512.png'));
