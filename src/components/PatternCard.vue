<script setup>
// ============================================================
// PatternCard.vue — 图纸预览 + 原图对比 + 材料统计 + 导出
// ============================================================
import { ref, watch, onMounted, nextTick } from 'vue'
import { renderPatternCanvas, assignSeq, printPattern, exportPNG, exportCSV } from '../lib/render.js'

const props = defineProps({
  pattern: { type: Object, required: true },
  params: { type: Object, required: true },
  boardCount: Number,
  sourceInfo: Object,
  sourceThumb: String,
})
const emit = defineEmits(['toast'])

const canvasRef = ref(null)
const viewMode = ref('overlay') // solid | overlay | symbol
const showGrid = ref(true)
const zoom = ref(1)
const showOriginal = ref(false) // 原图对比

const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3]

const numbered = ref(null)

async function draw() {
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return
  numbered.value = assignSeq(props.pattern)
  const base = renderPatternCanvas(numbered.value, {
    cellSize: 14,
    mode: viewMode.value,
    showGrid: showGrid.value,
  })
  canvas.width = base.width * zoom.value
  canvas.height = base.height * zoom.value
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height)
}

watch(() => [props.pattern, viewMode.value, showGrid.value, zoom.value], draw, { deep: true })
onMounted(draw)

function onPrint() {
  printPattern(numbered.value || assignSeq(props.pattern), {
    title: props.pattern.title,
    boardW: 29,
    boardH: 29,
    showSymbol: true,
  })
}

function onPNG() {
  exportPNG(numbered.value || assignSeq(props.pattern), {
    cellSize: 12,
    mode: viewMode.value,
    showGrid: showGrid.value,
    filename: `${props.pattern.title || 'pattern'}_图纸`,
  })
  emit('toast', 'PNG 已导出 📥')
}

function onCSV() {
  exportCSV(numbered.value || assignSeq(props.pattern))
  emit('toast', '材料清单 CSV 已导出 📥')
}

const totalBeads = () => props.pattern.width * props.pattern.height
</script>

<template>
  <div class="card" data-step="3" style="--i:3">
    <h2><span class="no">3</span>拼豆图纸</h2>
    <p class="desc" v-if="pattern">
      {{ pattern.width }}×{{ pattern.height }} 格 · {{ pattern.stats.length }} 种颜色 ·
      约 {{ boardCount }} 块 29×29 拼豆板
      <span v-if="sourceInfo"> · 来源：{{ sourceInfo.name }}</span>
    </p>

    <div class="preview-tools">
      <button class="chip" :class="{ active: viewMode === 'solid' }" @click="viewMode = 'solid'">🎨 实色</button>
      <button class="chip" :class="{ active: viewMode === 'overlay' }" @click="viewMode = 'overlay'">🔣 叠加</button>
      <button class="chip" :class="{ active: viewMode === 'symbol' }" @click="viewMode = 'symbol'">🔢 符号</button>
      <button class="chip" :class="{ active: showGrid }" @click="showGrid = !showGrid"># 网格</button>
      <button class="chip" :class="{ active: showOriginal }" @click="showOriginal = !showOriginal">🖼️ 原图</button>
      <span style="flex:1"></span>
      <button class="chip" @click="zoom = ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)]">−</button>
      <span style="font-size:12px;color:var(--muted);align-self:center">{{ Math.round(zoom * 100) }}%</span>
      <button class="chip" @click="zoom = ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)]">＋</button>
    </div>

    <div class="preview-wrap">
      <img v-if="showOriginal && sourceThumb" :src="sourceThumb" alt="原图" class="thumb-view" />
      <canvas v-else ref="canvasRef"></canvas>
    </div>

    <div class="btn-row">
      <button class="btn-ghost" @click="onPNG">🖼️ 导出 PNG</button>
      <button class="btn-ghost" @click="onPrint">🖨️ 打印图纸</button>
      <button class="btn-ghost" @click="onCSV">📋 材料清单</button>
    </div>

    <div style="margin-top:14px">
      <h3 style="font-size:13.5px;font-weight:800;margin:0 0 8px">🧮 所需豆子（共 {{ totalBeads() }} 颗）</h3>
      <table class="stats-table">
        <thead>
          <tr><th style="width:44px">色号</th><th style="width:40px">序</th><th>颜色</th><th>名称</th><th style="text-align:right">数量</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in pattern.stats" :key="s.color.id">
            <td><span class="line-no">{{ s.color.line || '·' }}</span></td>
            <td class="seq">{{ s.color.seq || numbered?.paletteObj.colors.find(c => c.id === s.color.id)?.seq || '·' }}</td>
            <td><span class="sw" :style="{ background: s.color.hex }"></span></td>
            <td>{{ s.color.nameZh }} <span style="color:var(--muted);font-size:11px">{{ s.color.name }}</span></td>
            <td class="cnt">{{ s.count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
