<script setup>
// ============================================================
// App.vue — 拼豆图纸生成器主界面（多巴胺版）
// ============================================================
import { reactive, ref, computed } from 'vue'
import UploadCard from './components/UploadCard.vue'
import AICard from './components/AICard.vue'
import SettingsCard from './components/SettingsCard.vue'
import PatternCard from './components/PatternCard.vue'
import AiSettingsModal from './components/AiSettingsModal.vue'
import ContactModal from './components/ContactModal.vue'
import { fileToPattern, makeThumb } from './lib/pipeline.js'
import { getPalette } from './lib/palettes.js'

const mode = ref('upload') // upload | ai
const pattern = ref(null)  // 当前图纸
const processing = ref(false)
const showAiSettings = ref(false)
const showContact = ref(false)
const toastMsg = ref('')
let toastTimer = null
const sourceFile = ref(null) // 当前源图（用于参数变化后重新生成）

const params = reactive({
  gridW: 29,
  gridH: 29,
  maxColors: 0,      // 0 = 不限制
  denoise: true,
  useClustering: true, // k-means 主色聚类，更拟合原图
  paletteId: 'perler',
})

const sourceInfo = ref(null) // { name, w, h }
const sourceThumb = ref('')  // 原图缩略图 dataURL（对比用）

function toast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 2800)
}

/** 🎉 撒豆庆祝：图纸生成成功时，彩色的拼豆从顶部洒落 */
const BEAD_COLORS = ['#FF5CA8', '#FF9F1C', '#FFC53D', '#35D07F', '#38B6FF', '#7C5CFF', '#FF4D6D', '#17C3B2']
function celebrate() {
  const count = 26
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div')
    b.className = 'bead-c'
    const size = 8 + Math.random() * 7
    b.style.setProperty('--s', `${size}px`)
    b.style.setProperty('--c', BEAD_COLORS[i % BEAD_COLORS.length])
    b.style.left = `${4 + Math.random() * 92}vw`
    b.style.setProperty('--fx', `${(Math.random() - 0.5) * 140}px`)
    b.style.setProperty('--fd', `${1.7 + Math.random() * 1.3}s`)
    b.style.setProperty('--fdelay', `${Math.random() * 0.45}s`)
    document.body.appendChild(b)
    setTimeout(() => b.remove(), 3400)
  }
}

/** 统一入口：任意图片 File/Blob → 图纸 */
async function processSource(file, info) {
  processing.value = true
  try {
    const p = await fileToPattern(file, {
      gridW: params.gridW,
      gridH: params.gridH,
      maxColors: params.maxColors,
      denoise: params.denoise,
      useClustering: params.useClustering,
      paletteId: params.paletteId,
    })
    p.paletteId = params.paletteId
    pattern.value = p
    sourceInfo.value = info
    sourceFile.value = file
    sourceThumb.value = await makeThumb(file, 260)
    toast(`🎉 图纸生成成功！${p.width}×${p.height} 格 · ${p.stats.length} 色`)
    celebrate()
  } catch (e) {
    toast(`生成失败：${e.message}`)
  } finally {
    processing.value = false
  }
}

/** 参数变化 → 用同一张源图重新生成 */
async function regenerate() {
  if (!sourceFile.value) return
  await processSource(sourceFile.value, sourceInfo.value)
}

const boardCount = computed(() => {
  if (!pattern.value) return 0
  const { width, height } = pattern.value
  return Math.ceil(width / 29) * Math.ceil(height / 29)
})

// 背景漂浮豆配置（不同位置/颜色/速度）
const FLOAT_BEADS = [
  { x: '6%', y: '16%', c: '#FF5CA8', s: 13, dur: '10s', dx: '30px', d: '-2s' },
  { x: '88%', y: '10%', c: '#FFC53D', s: 11, dur: '13s', dx: '-24px', d: '-6s' },
  { x: '12%', y: '52%', c: '#38B6FF', s: 10, dur: '12s', dx: '26px', d: '-9s' },
  { x: '82%', y: '44%', c: '#35D07F', s: 14, dur: '14s', dx: '-30px', d: '-3s' },
  { x: '8%', y: '80%', c: '#7C5CFF', s: 12, dur: '11s', dx: '22px', d: '-7s' },
  { x: '90%', y: '74%', c: '#FF4D6D', s: 9, dur: '15s', dx: '-18px', d: '-11s' },
  { x: '46%', y: '6%', c: '#FF9F1C', s: 8, dur: '16s', dx: '20px', d: '-4s' },
  { x: '64%', y: '88%', c: '#FF5CA8', s: 10, dur: '12s', dx: '18px', d: '-8s' },
]
</script>

<template>
  <!-- 背景装饰：彩色光斑 + 漂浮拼豆 -->
  <div class="bg-fx" aria-hidden="true">
    <div class="bg-blob b1"></div>
    <div class="bg-blob b2"></div>
    <div class="bg-blob b3"></div>
    <i v-for="(b, i) in FLOAT_BEADS" :key="i" class="float-bead"
       :style="{ '--x': b.x, '--y': b.y, '--c': b.c, '--s': b.s + 'px', '--dur': b.dur, '--dx': b.dx, '--delay': b.d }"></i>
  </div>

  <div class="topbar">
    <div class="logo"><i></i><i></i><i></i><i></i></div>
    <div>
      <h1>拼豆图纸生成器</h1>
      <div class="sub">Perler Studio · 图片 / AI 一键出图纸</div>
    </div>
    <div class="spacer"></div>
    <button class="icon-btn" title="AI 设置" @click="showAiSettings = true"><span class="gear">⚙️</span></button>
  </div>

  <div class="container">
    <!-- 模式切换 -->
    <div class="mode-switch" style="--i:0">
      <button :class="{ active: mode === 'upload' }" @click="mode = 'upload'"><span class="em">🖼️</span> 图片转图纸</button>
      <button :class="{ active: mode === 'ai' }" @click="mode = 'ai'"><span class="em">✨</span> AI 生成</button>
    </div>

    <!-- 第 1 步：来源 -->
    <UploadCard v-if="mode === 'upload'" :processing="processing" @file="(f, info) => processSource(f, info)" @toast="toast" />
    <AICard v-else @image="(f, info) => processSource(f, info)" @toast="toast" />

    <!-- 第 2 步：参数 -->
    <SettingsCard v-model:params="params" :has-source="!!sourceFile" @regenerate="regenerate" />

    <!-- 第 3 步：图纸 -->
    <PatternCard v-if="pattern" :pattern="pattern" :params="params" :board-count="boardCount" :source-info="sourceInfo" :source-thumb="sourceThumb" @toast="toast" />

    <div v-else class="card empty" style="--i:3">
      <div class="big">🧩</div>
      上传图片或 AI 生成图案后，这里会出现你的拼豆图纸
    </div>

    <div class="footer">
      数据全程在本地处理，不上传任何服务器 · 支持添加到主屏幕使用<br />
      开发者：涛涛 · <button class="link-btn" @click="showContact = true">📮 联系作者</button><br />
      Perler Studio <span class="heart">❤</span> 为拼豆爱好者制作
    </div>
  </div>

  <ContactModal v-if="showContact" @close="showContact = false" />
  <AiSettingsModal v-if="showAiSettings" @close="showAiSettings = false" @toast="toast" />
  <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
</template>
