// ============================================================
// render.js — 图纸渲染
// 1) Canvas 屏幕预览：实色 / 实色+淡符号叠加 / 符号
// 2) SVG 打印版（A4 分页 + 色号 + 图例，适合照着拼）
// ============================================================

const CELL = 5.6 // 打印版每格边长 mm
const PAD = 12 // 页边距 mm

/** 计算 hex 明度，决定叠加符号用深色还是浅色 */
function luminance(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 渲染 Canvas 预览图
 * @param {object} pattern { indices, paletteObj, width, height }
 * @param {object} opts { cellSize, showGrid, mode: 'solid'|'overlay'|'symbol', symbolAlpha }
 */
export function renderPatternCanvas(pattern, opts = {}) {
  const { indices, paletteObj, width, height } = pattern
  const cell = opts.cellSize || 14
  const mode = opts.mode || 'solid'
  const showGrid = opts.showGrid !== false
  const symbolAlpha = opts.symbolAlpha != null ? opts.symbolAlpha : 0.44
  const canvas = document.createElement('canvas')
  canvas.width = width * cell
  canvas.height = height * cell
  const ctx = canvas.getContext('2d')

  const majorEvery = 5
  const symFont = (size) => `bold ${Math.max(5, size)}px sans-serif`
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = paletteObj.colors[indices[y][x]]
      const px = x * cell, py = y * cell
      if (mode === 'symbol') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(px, py, cell, cell)
        ctx.fillStyle = '#222'
        ctx.font = symFont(cell * 0.56)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(color.line || '', px + cell / 2, py + cell / 2 + 1)
      } else {
        // 实色 / 实色+叠加
        ctx.fillStyle = color.hex
        ctx.fillRect(px, py, cell, cell)
        if (mode === 'overlay' && color.line) {
          // 淡色符号叠加在实色上：按底色明暗选黑/白，半透明显示
          ctx.fillStyle = luminance(color.hex) > 150 ? `rgba(20,20,30,${symbolAlpha})` : `rgba(255,255,255,${symbolAlpha})`
          ctx.font = symFont(cell * 0.5)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(color.line, px + cell / 2, py + cell / 2 + 1)
        }
      }
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.14)'
        ctx.lineWidth = 0.6
        ctx.strokeRect(px + 0.3, py + 0.3, cell - 0.6, cell - 0.6)
      }
    }
  }
  if (showGrid) {
    ctx.strokeStyle = 'rgba(0,0,0,0.42)'
    ctx.lineWidth = 1.4
    for (let i = 0; i <= width; i += majorEvery) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, height * cell); ctx.stroke()
    }
    for (let j = 0; j <= height; j += majorEvery) {
      ctx.beginPath(); ctx.moveTo(0, j * cell); ctx.lineTo(width * cell, j * cell); ctx.stroke()
    }
  }
  return canvas
}

/** 符号序号：给色板颜色补 seq 编号（按图纸出现顺序，打印版/图例用） */
export function assignSeq(pattern) {
  const seqMap = new Map()
  let n = 1
  for (const s of pattern.stats) seqMap.set(s.color.id, n++)
  return {
    ...pattern,
    paletteObj: {
      ...pattern.paletteObj,
      colors: pattern.paletteObj.colors.map((c) => ({ ...c, seq: seqMap.get(c.id) || 0 })),
    },
  }
}

/**
 * 构建打印版 HTML
 */
export function buildPrintHTML(pattern, opts = {}) {
  const { indices, paletteObj, width, height, stats } = pattern
  const boardW = opts.boardW || 29
  const boardH = opts.boardH || 29
  const title = opts.title || '拼豆图纸'
  const date = new Date().toLocaleDateString('zh-CN')
  const showSymbol = opts.showSymbol !== false // 打印版默认带符号

  const pages = []
  for (let py = 0; py < height; py += boardH) {
    for (let px = 0; px < width; px += boardW) pages.push({ px, py })
  }

  const cellMM = CELL
  const boardSVG = (px, py) => {
    const bw = Math.min(boardW, width - px)
    const bh = Math.min(boardH, height - py)
    const sw = bw * cellMM, sh = bh * cellMM
    let svg = `<svg width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}" xmlns="http://www.w3.org/2000/svg">`
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const c = paletteObj.colors[indices[py + y][px + x]]
        const xx = x * cellMM, yy = y * cellMM
        const lum = luminance(c.hex)
        const txtFill = lum > 150 ? 'rgba(20,20,30,0.5)' : 'rgba(255,255,255,0.55)'
        const fsz = cellMM * 0.52
        svg += `<rect x="${xx}" y="${yy}" width="${cellMM}" height="${cellMM}" fill="${c.hex}" stroke="rgba(0,0,0,0.13)" stroke-width="0.25"/>`
        if (showSymbol && c.line) {
          svg += `<text x="${xx + cellMM / 2}" y="${yy + cellMM / 2 + fsz * 0.34}" font-size="${fsz}" font-weight="bold" text-anchor="middle" fill="${txtFill}" font-family="Arial">${c.line}</text>`
        }
      }
    }
    for (let i = 0; i <= bw; i += 5) svg += `<line x1="${i * cellMM}" y1="0" x2="${i * cellMM}" y2="${sh}" stroke="#333" stroke-width="0.8"/>`
    for (let j = 0; j <= bh; j += 5) svg += `<line x1="0" y1="${j * cellMM}" x2="${sw}" y2="${j * cellMM}" stroke="#333" stroke-width="0.8"/>`
    svg += '</svg>'
    return svg
  }

  const legendHTML = `
    <table class="legend">
      ${stats.map(({ color, count }) => `
        <tr>
          <td><span class="swatch" style="background:${color.hex}"></span></td>
          <td class="sym">${color.line || color.seq || ''}</td>
          <td class="nm">${color.nameZh} (${color.name})</td>
          <td class="cnt">${count} 颗</td>
        </tr>`).join('')}
    </table>`

  const pagesHTML = pages.map(({ px, py }, i) => `
    <section class="page">
      <header>
        <div class="ptitle">${title} — 第 ${i + 1}/${pages.length} 板</div>
        <div class="pmeta">色板：${pattern.paletteObj.brandZh} ｜ 尺寸 ${width}×${height} 格 ｜ ${date}</div>
      </header>
      <div class="board">${boardSVG(px, py)}</div>
      <footer>拼接位置：行 ${py + 1}–${Math.min(height, py + boardH)} 列 ${px + 1}–${Math.min(width, px + boardW)}</footer>
    </section>`).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"/>
<title>${title} - 拼豆图纸</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #222; }
  .page { width: 210mm; min-height: 297mm; padding: ${PAD}mm; page-break-after: always; display: flex; flex-direction: column; }
  header { margin-bottom: 4mm; }
  .ptitle { font-size: 18pt; font-weight: 800; }
  .pmeta { font-size: 9pt; color: #666; margin-top: 1mm; }
  .board { margin: 0 auto; }
  .board svg { display: block; max-width: 186mm; height: auto; }
  footer { margin-top: 3mm; font-size: 9pt; color: #888; text-align: center; }
  .legend { margin: ${PAD}mm auto 0; border-collapse: collapse; font-size: 9.5pt; }
  .legend td { padding: 1mm 2.5mm; border-bottom: 0.3pt solid #ddd; }
  .swatch { display: inline-block; width: 6mm; height: 6mm; border: 0.3pt solid #999; vertical-align: middle; }
  .sym { text-align: center; font-weight: 700; }
  .cnt { color: #666; text-align: right; }
  @media print { .page { min-height: auto; } }
</style></head>
<body>
${pagesHTML}
<section class="page"><h2 style="font-size:16pt;margin-bottom:4mm">材料清单（色号图例）</h2>${legendHTML}</section>
<script>window.onload = () => setTimeout(() => window.print(), 400)</script>
</body></html>`
}

/** 打开打印窗口 */
export function printPattern(pattern, opts = {}) {
  const html = buildPrintHTML(pattern, opts)
  const win = window.open('', '_blank')
  if (!win) { alert('浏览器拦截了打印窗口，请允许弹窗后重试'); return }
  win.document.write(html)
  win.document.close()
}

/**
 * 导出 PNG
 */
export function exportPNG(pattern, opts = {}) {
  const canvas = renderPatternCanvas(pattern, { cellSize: opts.cellSize || 12, mode: opts.mode || 'overlay', showGrid: opts.showGrid !== false })
  canvas.toBlob((blob) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${opts.filename || 'pattern'}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 3000)
  }, 'image/png')
}

/** 导出 CSV 材料清单 */
export function exportCSV(pattern) {
  const rows = [['色号', '颜色', '英文名', 'HEX', '数量(颗)']]
  pattern.stats.forEach(({ color, count }) => {
    rows.push([color.line, color.nameZh, color.name, color.hex, count])
  })
  rows.push(['', '', '', '合计', pattern.width * pattern.height])
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${pattern.title || 'pattern'}_材料清单.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 3000)
}
