// 核心算法验证：色差公式 + 色板匹配 + 色板完整性
import { hexToRgb, rgbToHex, deltaE2000, rgbToLab, preparePalette } from '../src/lib/color.js'
import { getPalette } from '../src/lib/palettes.js'

let fail = 0
function assert(cond, msg) {
  if (!cond) { console.error('  ✗ FAIL:', msg); fail++ }
  else console.log('  ✓', msg)
}
function nearestColor(rgb, pal) {
  const lab = rgbToLab(...rgb)
  let best = null, bestD = Infinity
  for (const c of pal.colors) {
    const d = deltaE2000(lab, c.lab)
    if (d < bestD) { bestD = d; best = c }
  }
  return { color: best, dE: bestD }
}

console.log('=== 1. hex ↔ rgb 往返 ===')
assert(rgbToHex(...hexToRgb('#3E6FB5')) === '#3e6fb5', 'hexToRgb/rgbToHex 往返一致')

console.log('=== 2. CIEDE2000 经典测试对 ===')
const d1 = deltaE2000([50, 2.677, -79.775], [50, 0, -82.748])
assert(d1 > 2.03 && d1 < 2.06, `测试对1 dE=${d1.toFixed(4)}（期望 ≈2.0425）`)
const d2 = deltaE2000([50, 0, -82.748], [50, 2.677, -79.775])
assert(Math.abs(d1 - d2) < 1e-9, `对称性 dE1=${d1.toFixed(4)} dE2=${d2.toFixed(4)}`)

console.log('=== 3. 色板匹配 sanity check ===')
const pal = preparePalette(getPalette('perler'))
const cases = [
  ['#FFFFFF', 'White'], ['#FF0000', 'Red'], ['#0000FF', 'Dark Blue'],
  ['#000000', 'Black'], ['#00FF00', 'Bright Green'], ['#FFD700', 'Cheddar'],
  ['#FF69B4', 'Bubblegum'], ['#808080', 'Gray'], ['#964B00', 'Brown'],
]
for (const [hex, expect] of cases) {
  const { color, dE } = nearestColor(hexToRgb(hex), pal)
  const ok = color.name === expect || dE < 12
  console.log(`  ${hex} → ${color.nameZh}(${color.name}) dE=${dE.toFixed(1)} ${ok ? 'ok' : '⚠ 期望' + expect}`)
  if (!ok) fail++
}

console.log('=== 4. 色板完整性 ===')
assert(pal.colors.length >= 60, `色板颜色数 ${pal.colors.length}（≥60）`)
const dup = new Set(pal.colors.map(c => c.hex)).size !== pal.colors.length
assert(!dup, '色板 hex 无重复')
const ids = new Set(pal.colors.map(c => c.id))
assert(ids.size === pal.colors.length, '色板 id 无重复')

console.log(fail === 0 ? '\n✅ 全部通过' : `\n❌ ${fail} 项失败`)
process.exit(fail === 0 ? 0 : 1)
