import { getPalette } from '../src/lib/palettes.js'
import { preparePalette } from '../src/lib/color.js'
import { kmeans } from '../src/lib/pipeline.js'

let fail = 0
const assert = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) fail++ }

console.log('=== 色号表检查 ===')
const pal = getPalette('perler')
const black = pal.colors.find(c => c.name === 'Black')
const white = pal.colors.find(c => c.name === 'White')
assert(black?.line === 'H3', `黑色=H3 (实际 ${black?.line})`)
assert(white?.line === 'H1', `白色=H1 (实际 ${white?.line})`)
console.log('色号唯一性:', new Set(pal.colors.map(c => c.line)).size === pal.colors.length ? '无重复' : '有重复!')
const pp = preparePalette(pal)
assert(pp.colors.every(c => c.line && c.rgb && c.lab), 'preparePalette 保留 line + 计算 rgb/lab')

console.log('=== k-means 聚类 ===')
// 三组明显颜色簇
const pts = []
for (let i = 0; i < 30; i++) pts.push([230, 50, 60]) // 红
for (let i = 0; i < 30; i++) pts.push([40, 100, 220]) // 蓝
for (let i = 0; i < 30; i++) pts.push([240, 220, 40]) // 黄
const assign = kmeans(pts, 3)
const clusterOf = (point) => {
  // 找代表点
  return assign[pts.findIndex(p => p[0] === point[0] && p[1] === point[1] && p[2] === point[2])]
}
const ri = clusterOf([230,50,60]), bi = clusterOf([40,100,220]), yi = clusterOf([240,220,40])
assert(ri !== undefined, '聚类返回索引')
console.log('  红簇', ri, '蓝簇', bi, '黄簇', yi)
assert(ri !== bi && bi !== yi && ri !== yi, '三类各自独立聚类')

console.log(fail === 0 ? '\n✅ 算法检查通过' : `\n❌ ${fail} 项失败`)
process.exit(fail ? 1 : 0)
