// ============================================================
// pipeline.js — 核心处理管线
// 图片 → 像素化网格 → 色板量化(可选 k-means 主色聚类) → 图纸数据
// 全程本地计算，不依赖任何服务器
// ============================================================

import { preparePalette, nearestColor, deltaE2000, rgbToLab, hexToRgb } from './color.js'
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

/** 生成缩略图 dataURL（用于原图对比） */
export function makeThumb(file, maxSide = 260) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.naturalWidth, h = img.naturalHeight
      const s = Math.min(1, maxSide / Math.max(w, h))
      w = Math.max(1, Math.round(w * s))
      h = Math.max(1, Math.round(h * s))
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve('') }
    img.src = url
  })
}

/**
 * 像素化：ImageData → gridW×gridH 的格子平均色矩阵
 * 用高质量区域平均采样，保留原图明暗与形状
 */
export function pixelate(imageData, gridW, gridH) {
  const { data, width, height } = imageData
  const sw = Math.max(gridW, 1), sh = Math.max(gridH, 1)
  // 高质量缩小到网格尺寸（浏览器用双线性/区域平均，天然抗锯齿）
  const off = document.createElement('canvas')
  off.width = width
  off.height = height
  off.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0)
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
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
 * 保守降噪：只去除完全孤立的单点杂色（颜色与周围 8 格都差异极大），
 * 不破坏原图结构，保留边缘与形状细节
 */
export function denoise(grid, threshold = 90) {
  const h = grid.length, w = grid[0].length
  const out = grid.map((r) => r.map((c) => [...c]))
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const c = grid[y][x]
      let allFar = true, maxD = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const d = dist(c, grid[y + dy][x + dx])
          if (d > maxD) maxD = d
          if (d <= threshold) { allFar = false }
        }
      }
      if (allFar) {
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
 * k-means 主色聚类：把图片实际出现的颜色聚成 k 个主色簇，
 * 再映射到色板最近色。比逐格最近色更聚焦原图真实主色，去杂色、更拟合。
 * @param {number[][]} points 每格颜色 [[r,g,b],...]
 * @param {number} k 目标颜色数
 * @returns {number[]} 每个点的簇索引
 */
export function kmeans(points, k, maxIter = 20) {
  const n = points.length
  if (k <= 0 || k >= n) return points.map((_, i) => i % k)
  // k-means++ 初始化
  const centers = []
  const first = Math.floor(Math.random() * n)
  centers.push([...points[first]])
  while (centers.length < k) {
    let best = -1, bestD = -1
    for (let i = 0; i < n; i++) {
      let d = Infinity
      for (const c of centers) d = Math.min(d, (points[i][0] - c[0]) ** 2 + (points[i][1] - c[1]) ** 2 + (points[i][2] - c[2]) ** 2)
      if (d > bestD) { bestD = d; best = i }
    }
    centers.push([...points[best]])
  }
  const assign = new Array(n).fill(0)
  const counts = new Array(k).fill(0)
  for (let it = 0; it < maxIter; it++) {
    // assign
    for (let i = 0; i < n; i++) {
      let b = 0, bd = Infinity
      for (let j = 0; j < k; j++) {
        const d = (points[i][0] - centers[j][0]) ** 2 + (points[i][1] - centers[j][1]) ** 2 + (points[i][2] - centers[j][2]) ** 2
        if (d < bd) { bd = d; b = j }
      }
      assign[i] = b
    }
    // update centers
    const sums = Array.from({ length: k }, () => [0, 0, 0])
    counts.fill(0)
    for (let i = 0; i < n; i++) {
      const j = assign[i]
      sums[j][0] += points[i][0]; sums[j][1] += points[i][1]; sums[j][2] += points[i][2]
      counts[j]++
    }
    let changed = false
    for (let j = 0; j < k; j++) {
      if (counts[j] > 0) {
        const nc = [sums[j][0] / counts[j], sums[j][1] / counts[j], sums[j][2] / counts[j]]
        if (Math.abs(nc[0] - centers[j][0]) + Math.abs(nc[1] - centers[j][1]) + Math.abs(nc[2] - centers[j][2]) > 0.5) changed = true
        centers[j] = nc
      }
    }
    if (!changed) break
  }
  return assign
}

/**
 * 色板量化：grid → 每格色板索引矩阵 + 颜色统计
 * @param {number[][][]} grid
 * @param {object} palette 已 prepare 的色板
 * @param {object} opts { maxColors: 限制颜色数(0=不限制), useClustering: 用 k-means 聚类更拟合 }
 * @returns {{ indices:number[][], stats:Map, grid, palette, width, height }}
 */
export function quantize(grid, palette, opts = {}) {
  const { maxColors = 0, useClustering = true } = opts
  const height = grid.length
  const width = grid[0].length
  const flat = []
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) flat.push(grid[y][x])

  const indices = []
  let counts

  if (useClustering && maxColors > 0) {
    // k-means 聚类 → 每簇中心映射到色板最近色 → 格子取所属簇的色板色
    const k = Math.min(maxColors, flat.length)
    const assign = kmeans(flat, k)
    // 每簇中心
    const sums = Array.from({ length: k }, () => [0, 0, 0])
    const cnt = new Array(k).fill(0)
    for (let i = 0; i < flat.length; i++) {
      const j = assign[i]
      sums[j][0] += flat[i][0]; sums[j][1] += flat[i][1]; sums[j][2] += flat[i][2]
      cnt[j]++
    }
    const centerColor = sums.map((s, j) => cnt[j] > 0 ? [s[0] / cnt[j], s[1] / cnt[j], s[2] / cnt[j]] : flat[assign.indexOf(j)] || [128, 128, 128])
    const clusterPaletteIdx = centerColor.map((rgb) => palette.colors.indexOf(nearestColor(rgb, palette).color))

    let idx = 0
    counts = new Map()
    for (let y = 0; y < height; y++) {
      const row = []
      for (let x = 0; x < width; x++) {
        const palIdx = clusterPaletteIdx[assign[idx++]]
        row.push(palIdx)
        counts.set(palIdx, (counts.get(palIdx) || 0) + 1)
      }
      indices.push(row)
    }
  } else {
    // 逐格最近色
    counts = new Map()
    for (let y = 0; y < height; y++) {
      const row = []
      for (let x = 0; x < width; x++) {
        const { color } = nearestColor(flat[y * width + x], palette)
        const idx = palette.colors.indexOf(color)
        row.push(idx)
        counts.set(idx, (counts.get(idx) || 0) + 1)
      }
      indices.push(row)
    }
  }

  // 统计（按使用量降序）
  const stats = [...counts.entries()]
    .map(([idx, count]) => ({ color: palette.colors[idx], count }))
    .sort((a, b) => b.count - a.count)

  return { indices, stats, grid, palette, width, height }
}

/**
 * 便捷入口：File → 完整 Pattern
 */
export async function fileToPattern(file, opts) {
  const img = await loadImage(file)
  const imageData = getImageData(img, 1600)
  const palette = preparePalette(getPalette(opts.paletteId || 'perler'))
  let grid = pixelate(imageData, opts.gridW, opts.gridH)
  if (opts.denoise) grid = denoise(grid)
  const { indices, stats, width, height } = quantize(grid, palette, {
    maxColors: opts.maxColors,
    useClustering: opts.useClustering !== false,
  })
  return {
    indices, stats, width, height,
    palette: palette.id,
    paletteObj: palette,
    title: file.name.replace(/\.[^.]+$/, '') || '拼豆图纸',
  }
}
