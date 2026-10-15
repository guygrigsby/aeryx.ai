// Run npm run brand:export after editing the two SVG masters.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const write = async (path, data) => {
  const url = new URL(path, root);
  await mkdir(new URL('.', url), { recursive: true });
  await writeFile(url, data);
};
const paths = (svg) => [...svg.matchAll(/<path\b[^>]*\/>/g)].map(([path]) => path).join('\n');
const mark = paths(await read('brand/masters/mark.svg'));
const word = paths(await read('brand/masters/wordmark.svg'));
const svg = (width, height, content, title, color = '#A98FD6') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="${color}" fill-rule="evenodd"><title>${title}</title>${content}</svg>\n`;
const png = (source, width) => sharp(Buffer.from(source)).resize({ width }).png().toBuffer();

const variants = {
  lavender: '#A98FD6', // Primary, including on the website's near-black ground.
  'on-light': '#73548F',
  'on-dark': '#EDE4FA',
  black: '#08090B',
  white: '#FFFFFF',
};
const lockups = {
  icon: [576, 576, `<g transform="translate(0 128)">${mark}</g>`],
  wordmark: [576, 160, word],
  horizontal: [1184, 320, `${mark}<g transform="translate(608 94)">${word}</g>`],
  stacked: [576, 528, `${mark}<g transform="translate(0 360)">${word}</g>`],
};
for (const [variant, color] of Object.entries(variants)) {
  for (const [lockup, [width, height, content]] of Object.entries(lockups)) {
    const source = svg(width, height, content, `aeryx ${lockup} — ${variant}`, color);
    const stem = `public/brand/aeryx-${lockup}-${variant}`;
    await write(`${stem}.svg`, source);
    for (const size of lockup === 'icon' ? [256, 512, 1024] : [512, 1024]) {
      await write(`${stem}-${size}.png`, await png(source, size));
    }
  }
}

// Browser tile: fixed dark ground survives both light and dark browser chrome.
// Six extra units on the arch keep its narrowest stroke visible at 16 px.
const microMark = mark.replace('id="arch"', 'id="arch" stroke="#A98FD6" stroke-width="6" stroke-linejoin="round"');
const tile = (content, title) => svg(576, 576,
  `<path fill="#08090B" d="M0 0H576V576H0Z"/>${content}`, title);
const favicon = tile(`<g transform="translate(0 128)">${microMark}</g>`, 'Aeryx');
await write('public/favicon.svg', favicon);
for (const size of [16, 32, 48]) {
  await write(`public/favicon-${size}x${size}.png`, await png(favicon, size));
}
// ICO directory with PNG payloads, supported by modern browser/OS icon loaders.
const icoSizes = [16, 32, 48];
const images = await Promise.all(icoSizes.map((size) => png(favicon, size)));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((data, i) => {
  const position = 6 + i * 16;
  header[position] = icoSizes[i];
  header[position + 1] = icoSizes[i];
  header.writeUInt16LE(1, position + 4);
  header.writeUInt16LE(32, position + 6);
  header.writeUInt32LE(data.length, position + 8);
  header.writeUInt32LE(offset, position + 12);
  offset += data.length;
});
await write('public/favicon.ico', Buffer.concat([header, ...images]));

const appIcon = tile(`<g transform="translate(0 128)">${mark}</g>`, 'Aeryx app icon');
await write('public/apple-touch-icon.png', await png(appIcon, 180));
for (const size of [192, 512]) {
  await write(`public/icon-${size}.png`, await png(appIcon, size));
}
// Entire mark stays within the manifest maskable icon's central safe circle.
const maskable = tile(`<g transform="translate(102 192) scale(.65)">${mark}</g>`, 'Aeryx maskable app icon');
await write('public/icon-maskable-512.png', await png(maskable, 512));

const social = svg(1200, 630,
  `<path fill="#08090B" d="M0 0H1200V630H0Z"/><g transform="translate(156 195) scale(.75)">${lockups.horizontal[2]}</g>`,
  'aeryx — a studio for agentic software');
await write('public/brand/social-preview.svg', social);
await write('public/brand/social-preview.png', await png(social, 1200));
console.log('Exported Aeryx SVG/PNG kit, favicon, touch/app icons and social card.');
