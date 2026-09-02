// ============================================================
// pipeline.js — 核心处理管线
// 图片 → 像素化网格 → 色板量化 → 图纸数据(Pattern)
// 全程本地计算，不依赖任何服务器
// ============================================================

import { preparePalette, nearestColor } from './color.js'
import { getPalette } from './palettes.js'

/**
 * 读取文件 → HTMLImageElement
 * @param {File|Blob} file
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片加载失败')) }
    img.src = url
  })
}

/**
 * 图片 → ImageData（等比缩放，最长边 maxSide）
 */
export function getImageData(img, maxSide = 1600) {
  let { naturalWidth: w, naturalHeight: h } = img
  const scale = Math.min(1, maxSide / Math.max(w, h))
  w = Math.max(1, Math.round(w * scale))
  h = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

/**
 * 像素化：ImageData → gridW×gridH 的格子平均色矩阵
 * @returns {number[][][]} grid[y][x] = [r,g,b]
 */
export function pixelate(imageData, gridW, gridH) {
  const { data, width, height } = imageData
  // 先把原图缩到 4× 网格尺寸做区域平均（质量更好）
  const sw = Math.max(gridW, 1), sh = Math.max(gridH, 1)
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const tmp = new ImageData(new Uint8ClampedArray(data), width, height)
  const off = document.createElement('canvas')
  off.width = width
  off.height = height
  off.getContext('2d').putImageData(tmp, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(off, 0, 0, sw, sh)
  const small = ctx.getImageData(0, 0, sw, sh).data

  const grid = []
  for (let y = 0; y < gridH; y++) {
    const row = []
    for (let x = 0; x < gridW; x++) {
      const i = (y * sw + x) * 4
      row.push([small[i], small[i + 1], small[i + 2]])
    }
    grid.push(row)
  }
  return grid
}

/**
 * 3×3 中值滤波降噪：去除单点杂色，让图纸更干净
 * @param {number[][][]} grid
 * @param {number} threshold 通道差阈值（超过才替换）
 */
export function denoise(grid, threshold = 28) {
  const h = grid.length, w = grid[0].length
  const out = grid.map((r) => r.map((c) => [...c]))
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const c = grid[y][x]
      // 与上下左右都差很大 → 是噪点
      let diffCount = 0, maxDiff = 0
      const neighbors = [grid[y - 1][x], grid[y + 1][x], grid[y][x - 1], grid[y][x + 1]]
      for (const n of neighbors) {
        const d = Math.abs(n[0] - c[0]) + Math.abs(n[1] - c[1]) + Math.abs(n[2] - c[2])
        if (d > threshold * 3) diffCount++
        maxDiff = Math.max(maxDiff, d)
      }
      if (diffCount >= 3 && maxDiff > threshold * 3) {
        // 用周围 8 格的中值替换
        const vals = [[], [], []]
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const n = grid[y + dy][x + dx]
            vals[0].push(n[0]); vals[1].push(n[1]); vals[2].push(n[2])
          }
        out[y][x] = [
          vals[0].sort((a, b) => a - b)[4],
          vals[1].sort((a, b) => a - b)[4],
          vals[2].sort((a, b) => a - b)[4],
        ]
      }
    }
  }
  return out
}

/**
 * 色板量化：grid → 每格色板索引矩阵 + 颜色统计
 * @param {number[][][]} grid
 * @param {object} palette 已 prepare 的色板
 * @param {object} opts { maxColors: 限制颜色数(0=不限制) }
 * @returns {{ indices:number[][], stats:Map, grid, palette, width, height }}
 */
export function quantize(grid, palette, opts = {}) {
  const { maxColors = 0 } = opts
  const height = grid.length
  const width = grid[0].length

  // 1. 逐格最近色
  const indices = []
  const counts = new Map() // paletteIndex -> count
  const used = new Set()
  for (let y = 0; y < height; y++) {
    const row = []
    for (let x = 0; x < width; x++) {
      const { color } = nearestColor(grid[y][x], palette)
      const idx = palette.colors.indexOf(color)
      row.push(idx)
      counts.set(idx, (counts.get(idx) || 0) + 1)
      used.add(idx)
    }
    indices.push(row)
  }

  // 2. 限制颜色数：保留使用频率最高的 N 色，其余映射到最近的保留色
  if (maxColors > 0 && used.size > maxColors) {
    const sorted = [...used].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0))
    const keep = new Set(sorted.slice(0, maxColors))
    const remap = new Map()
    for (const idx of used) {
      if (keep.has(idx)) continue
      // 找到最近的保留色
      let best = sorted[0], bestD = Infinity
      const labA = palette.colors[idx].lab
      for (const k of keep) {
        const labB = palette.colors[k].lab
        const d = (labA[0] - labB[0]) ** 2 + (labA[1] - labB[1]) ** 2 + (labA[2] - labB[2]) ** 2
        if (d < bestD) { bestD = d; best = k }
      }
      remap.set(idx, best)
    }
    const newCounts = new Map()
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let idx = indices[y][x]
        if (remap.has(idx)) idx = remap.get(idx)
        indices[y][x] = idx
        newCounts.set(idx, (newCounts.get(idx) || 0) + 1)
      }
    }
    counts.clear()
    for (const [k, v] of newCounts) counts.set(k, v)
  }

  // 3. 统计（按使用量降序）
  const stats = [...counts.entries()]
    .map(([idx, count]) => ({ color: palette.colors[idx], count }))
    .sort((a, b) => b.count - a.count)

  return { indices, stats, grid, palette, width, height }
}

/**
 * 便捷入口：File → 完整 Pattern
 * @param {File} file
 * @param {object} opts { gridW, gridH, maxColors, denoise:bool, paletteId }
 */
export async function fileToPattern(file, opts) {
  const img = await loadImage(file)
  const imageData = getImageData(img, 1600)
  const palette = preparePalette(getPalette(opts.paletteId || 'perler'))
  let grid = pixelate(imageData, opts.gridW, opts.gridH)
  if (opts.denoise) grid = denoise(grid)
  const { indices, stats, width, height } = quantize(grid, palette, { maxColors: opts.maxColors })
  return {
    indices, stats, width, height,
    palette: palette.id,
    paletteObj: palette,
    title: file.name.replace(/\.[^.]+$/, '') || '拼豆图纸',
  }
}
