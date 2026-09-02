// ============================================================
// color.js — 色彩科学：sRGB ↔ XYZ ↔ LAB、色差计算、最近色匹配
// 用于把图片颜色量化到拼豆色板
// ============================================================

/** #rrggbb → [r,g,b] (0-255) */
export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/** [r,g,b] (0-255) → #rrggbb */
export function rgbToHex(r, g, b) {
  const c = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** sRGB 通道 → 线性光 */
function srgbToLinear(c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/** [r,g,b] (0-255) → XYZ（D65 白点） */
function rgbToXyz(r, g, b) {
  let rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b)
  return [
    rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041,
  ]
}

function xyzToLab(x, y, z) {
  const refX = 0.95047, refY = 1.0, refZ = 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x / refX), fy = f(y / refY), fz = f(z / refZ)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** [r,g,b] → LAB */
export function rgbToLab(r, g, b) {
  return xyzToLab(...rgbToXyz(r, g, b))
}

/** CIEDE2000 色差（最接近人眼感知，拼豆配色首选） */
export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2
  const C1 = Math.sqrt(a1 * a1 + b1 * b1)
  const C2 = Math.sqrt(a2 * a2 + b2 * b2)
  const Cbar = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))))
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2
  const C1p = Math.sqrt(a1p * a1p + b1 * b1)
  const C2p = Math.sqrt(a2p * a2p + b2 * b2)
  const h1p = b1 === 0 && a1p === 0 ? 0 : (Math.atan2(b1, a1p) * 180 / Math.PI + 360) % 360
  const h2p = b2 === 0 && a2p === 0 ? 0 : (Math.atan2(b2, a2p) * 180 / Math.PI + 360) % 360
  const dLp = L2 - L1
  const dCp = C2p - C1p
  let dhp = 0
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360)
  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2
  const hbarp = C1p * C2p === 0 ? 0 : (Math.abs(h1p - h2p) <= 180 ? (h1p + h2p) / 2 : (h1p + h2p + 360) / 2)
  const T = 1 - 0.17 * Math.cos((hbarp - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hbarp * Math.PI / 180)
    + 0.32 * Math.cos((3 * hbarp + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hbarp - 63) * Math.PI / 180)
  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2))
  const RC = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)))
  const SL = 1 + 0.015 * Math.pow(Lbarp - 50, 2) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2))
  const SC = 1 + 0.045 * Cbarp
  const SH = 1 + 0.015 * Cbarp * T
  const RT = -Math.sin(2 * dTheta * Math.PI / 180) * RC
  const dL = dLp / SL, dC = dCp / SC, dH = dHp / SH
  return Math.sqrt(dL * dL + dC * dC + dH * dH + RT * dC * dH)
}

/**
 * 在色板中找最近色（CIEDE2000）
 * @param {number[]} rgb [r,g,b]
 * @param {{colors: {rgb:number[], lab:number[]}[]}} palette
 * @returns {{color, dE}}
 */
export function nearestColor(rgb, palette) {
  const target = rgbToLab(rgb[0], rgb[1], rgb[2])
  let best = null, bestD = Infinity
  for (const c of palette.colors) {
    const d = deltaE2000(target, c.lab)
    if (d < bestD) { bestD = d; best = c }
  }
  return { color: best, dE: bestD }
}

/** 预计算色板的 lab，加速匹配 */
export function preparePalette(palette) {
  return {
    ...palette,
    colors: palette.colors.map((c) => ({ ...c, rgb: hexToRgb(c.hex), lab: rgbToLab(...hexToRgb(c.hex)) })),
  }
}
