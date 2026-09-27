import sharp from '/Users/trent/Documents/cursor-project/RemoveHandwriting/removehandwriting-web/node_modules/sharp/lib/index.js'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = '/Users/trent/Documents/cursor-project/RemoveHandwriting'
const pub = path.join(root, 'removehandwriting-web/public')
const out = path.join(root, 'marketing/youtube-promo/generated')
await fs.mkdir(out, { recursive: true })

const W = 1920, H = 1080
const blue = '#1355e8', navy = '#07142f', cyan = '#37c8ff', green = '#38d98a', muted = '#9fb0d0'

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const text = (x, y, value, size, color = '#fff', weight = 700, anchor = 'start') =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`

const wrap = (x, y, lines, size, color = '#fff', weight = 700, gap = 1.15, anchor = 'start') =>
  lines.map((line, i) => text(x, y + i * size * gap, line, size, color, weight, anchor)).join('')

function base(content, accent = blue) {
  return Buffer.from(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="70%" cy="15%"><stop offset="0" stop-color="${accent}" stop-opacity=".35"/><stop offset="1" stop-color="${navy}" stop-opacity="0"/></radialGradient>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07142f"/><stop offset="1" stop-color="#111c3f"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000" flood-opacity=".42"/></filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#bg)"/><rect width="1920" height="1080" fill="url(#glow)"/>
    <circle cx="1740" cy="120" r="250" fill="${accent}" opacity=".08"/><circle cx="180" cy="960" r="280" fill="${cyan}" opacity=".05"/>
    ${content}
  </svg>`)
}

async function contain(input, width, height, background = { r: 255, g: 255, b: 255, alpha: 1 }) {
  return sharp(input).rotate().resize(width, height, { fit: 'contain', background }).png().toBuffer()
}

async function scene(name, svg, composites = []) {
  await sharp(svg).composite(composites).png().toFile(path.join(out, `${name}.png`))
}

const logo = await contain(path.join(pub, 'logo_512.png'), 116, 116, { r: 0, g: 0, b: 0, alpha: 0 })
const before = await contain(path.join(pub, 'demo/bahasa-indonesia-revision-worksheet-before.png'), 700, 525)
const after = await contain(path.join(pub, 'demo/bahasa-indonesia-revision-worksheet-after.png'), 700, 525)
const phone1 = await contain(path.join(pub, 'images/download0_0.webp'), 310, 670, { r: 0, g: 0, b: 0, alpha: 0 })
const phone2 = await contain(path.join(pub, 'images/download1_1.webp'), 310, 670, { r: 0, g: 0, b: 0, alpha: 0 })
const og = await contain(path.join(pub, 'upload-og-image.png'), 900, 473)

await scene('01-hook', base(`
  <rect x="130" y="110" width="116" height="116" rx="28" fill="#fff" opacity=".98"/>
  ${text(276, 185, 'RemoveHandwriting', 42)}
  ${wrap(130, 425, ['Your document is clean.', 'Your notes aren’t.'], 86)}
  ${text(130, 680, 'Erase handwriting with AI.', 50, cyan, 600)}
  <rect x="130" y="775" width="455" height="92" rx="46" fill="${blue}"/>
  ${text(358, 837, 'See the transformation', 32, '#fff', 700, 'middle')}
`, blue), [{ input: logo, left: 130, top: 110 }])

await scene('02-before-after', base(`
  ${text(960, 112, 'REAL DOCUMENT. REAL CLEANUP.', 31, cyan, 700, 'middle')}
  ${text(960, 190, 'From marked-up to ready to reuse', 62, '#fff', 800, 'middle')}
  <rect x="150" y="268" width="760" height="615" rx="34" fill="#fff" filter="url(#shadow)"/>
  <rect x="1010" y="268" width="760" height="615" rx="34" fill="#fff" filter="url(#shadow)"/>
  <rect x="185" y="297" width="142" height="52" rx="26" fill="#ff4f71"/>${text(256, 333, 'BEFORE', 25, '#fff', 800, 'middle')}
  <rect x="1045" y="297" width="126" height="52" rx="26" fill="${green}"/>${text(1108, 333, 'AFTER', 25, navy, 800, 'middle')}
  <circle cx="960" cy="580" r="68" fill="${blue}"/><path d="M935 548 L970 580 L935 612 M970 548 L1005 580 L970 612" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${text(960, 983, 'Handwriting removed. Printed content preserved.', 37, muted, 600, 'middle')}
`), [
  { input: before, left: 180, top: 333 },
  { input: after, left: 1040, top: 333 }
])

await scene('03-how', base(`
  ${text(960, 155, 'A clean copy in three simple steps', 66, '#fff', 800, 'middle')}
  ${text(960, 220, 'No complicated editing. No manual erasing.', 34, muted, 500, 'middle')}
  ${[310, 960, 1610].map((x, i) => `
    <circle cx="${x}" cy="470" r="128" fill="${['#1648b7', '#6137d5', '#0b9870'][i]}" opacity=".95"/>
    ${text(x, 505, String(i + 1).padStart(2, '0'), 88, '#fff', 800, 'middle')}
  `).join('')}
  <path d="M470 470 H800 M1120 470 H1450" stroke="#3c527e" stroke-width="8" stroke-dasharray="16 20"/>
  ${text(310, 690, 'Upload', 48, '#fff', 800, 'middle')}${text(310, 744, 'Image or PDF', 30, muted, 500, 'middle')}
  ${text(960, 690, 'AI cleans', 48, '#fff', 800, 'middle')}${text(960, 744, 'In just seconds', 30, muted, 500, 'middle')}
  ${text(1610, 690, 'Download', 48, '#fff', 800, 'middle')}${text(1610, 744, 'A reusable copy', 30, muted, 500, 'middle')}
`))

await scene('04-modes', base(`
  ${text(130, 180, 'The right cleanup for every page', 66, '#fff', 800)}
  ${text(130, 245, 'Choose your mode. Keep what matters.', 34, muted, 500)}
  ${[
    [130, '#1557e8', 'STANDARD', 'Fast scan-style cleanup', 'For everyday worksheets and forms'],
    [720, '#7c4dff', 'COLOR', 'Preserve the original look', 'Keep colors, highlights, and page tone'],
    [1310, '#00a77a', 'ULTRA', 'Deep document recovery', 'For difficult marks and complex pages']
  ].map(([x, c, title, a, b]) => `
    <rect x="${x}" y="350" width="480" height="460" rx="38" fill="#142348" stroke="${c}" stroke-width="4"/>
    <circle cx="${Number(x)+75}" cy="430" r="34" fill="${c}"/>
    ${text(Number(x)+125, 445, title, 34, '#fff', 800)}
    ${text(Number(x)+45, 565, a, 34, '#fff', 700)}
    ${wrap(Number(x)+45, 635, b.split(' ' + (b.includes('and') ? 'and' : 'page')), 27, muted, 500, 1.4)}
    <rect x="${Number(x)+45}" y="730" width="390" height="8" rx="4" fill="${c}" opacity=".8"/>
  `).join('')}
`))

await scene('05-pdf', base(`
  ${text(130, 175, 'More than a single image', 67, '#fff', 800)}
  ${wrap(130, 288, ['Clean selected PDF pages.', 'Batch-process documents.', 'Export one polished file.'], 48, '#fff', 650, 1.45)}
  <rect x="118" y="725" width="620" height="92" rx="46" fill="${blue}"/>
  ${text(428, 787, 'Images • PDFs • Scans', 32, '#fff', 800, 'middle')}
  <rect x="900" y="245" width="900" height="473" rx="34" fill="#fff" filter="url(#shadow)"/>
`, '#6845e8'), [{ input: og, left: 900, top: 245 }])

await scene('06-mobile', base(`
  ${text(130, 178, 'Clean documents wherever you work', 62, '#fff', 800)}
  ${wrap(130, 300, ['Use it in your browser.', 'Or take it with you.'], 47, '#fff', 600, 1.45)}
  <rect x="130" y="650" width="320" height="82" rx="41" fill="#fff"/>${text(290, 704, 'iPhone & iPad', 28, navy, 800, 'middle')}
  <rect x="475" y="650" width="300" height="82" rx="41" fill="#fff"/>${text(625, 704, 'Android', 28, navy, 800, 'middle')}
  <rect x="800" y="650" width="320" height="82" rx="41" fill="${blue}"/>${text(960, 704, 'Web App', 28, '#fff', 800, 'middle')}
  <ellipse cx="1490" cy="900" rx="390" ry="55" fill="#000" opacity=".35"/>
`, '#7c4dff'), [
  { input: phone1, left: 1195, top: 270 },
  { input: phone2, left: 1455, top: 195 }
])

await scene('07-privacy', base(`
  <circle cx="480" cy="525" r="260" fill="#0b9870" opacity=".18"/>
  <path d="M480 295 C585 345 655 360 655 470 V570 C655 705 555 790 480 830 C405 790 305 705 305 570 V470 C305 360 375 345 480 295 Z" fill="${green}" opacity=".95"/>
  <path d="M400 560 L456 620 L574 488" stroke="#fff" stroke-width="34" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${text(880, 350, 'Your documents stay yours.', 66, '#fff', 800)}
  ${wrap(880, 470, ['Secure processing', 'Automatic deletion after processing', 'Not used for model training'], 38, '#fff', 600, 1.75)}
`,'#00a77a'))

await scene('08-cta', base(`
  <rect x="170" y="165" width="128" height="128" rx="30" fill="#fff"/>
  ${text(340, 247, 'RemoveHandwriting', 46, '#fff', 800)}
  ${text(960, 510, 'Clean documents.', 86, '#fff', 800, 'middle')}
  ${text(960, 620, 'Fresh possibilities.', 86, cyan, 800, 'middle')}
  <rect x="610" y="740" width="700" height="108" rx="54" fill="${blue}"/>
  ${text(960, 812, 'Start free at RemoveHandwriting.com', 34, '#fff', 800, 'middle')}
  ${text(960, 930, 'No credit card required', 29, muted, 600, 'middle')}
`), [{ input: logo, left: 176, top: 171 }])

console.log(out)
