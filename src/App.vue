<script setup>
// ============================================================
// App.vue — 拼豆图纸生成器主界面（多巴胺灵动高级风 v3）
// ============================================================
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const sourceFile = ref(null)

const params = reactive({
  gridW: 48,
  gridH: 48,
  maxColors: 0,
  denoise: true,
  useClustering: true,
  paletteId: 'perler',
})

const sourceInfo = ref(null)
const sourceThumb = ref('')

// —— 主题（自动跟随系统 + 手动切换，存 localStorage） ——
const theme = ref('light')
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light')
}
function initTheme() {
  const saved = localStorage.getItem('perler_theme')
  if (saved === 'dark' || saved === 'light') {
    theme.value = saved
  } else {
    theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  applyTheme(theme.value)
}
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('perler_theme', theme.value)
  applyTheme(theme.value)
}
function openGithub() {
  window.open('https://github.com/taotao-0817/perler-studio', '_blank', 'noopener')
}
// 尽早初始化主题，避免首帧闪烁
initTheme()
onMounted(() => {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('perler_theme')) {
      theme.value = e.matches ? 'dark' : 'light'
      applyTheme(theme.value)
    }
  })
})

// —— 鼠标跟随微光（节流，不作用画布内） ——
const glowRef = ref(null)
let glowRaf = null
function onMouse(e) {
  if (glowRaf) return
  glowRaf = requestAnimationFrame(() => {
    glowRaf = null
    if (glowRef.value) {
      glowRef.value.style.left = e.clientX + 'px'
      glowRef.value.style.top = e.clientY + 'px'
      glowRef.value.classList.add('visible')
    }
  })
}
onMounted(() => window.addEventListener('mousemove', onMouse, { passive: true }))
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouse)
  if (glowRaf) cancelAnimationFrame(glowRaf)
})

function toast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 2800)
}

/** 🎉 撒豆庆祝 */
const BEAD_COLORS = ['#ff4da6', '#22e0ff', '#ffed4e', '#b87bff', '#ff4da6', '#22e0ff']
function celebrate() {
  const count = 22
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div')
    b.className = 'bead-c'
    const size = 8 + Math.random() * 6
    b.style.setProperty('--s', `${size}px`)
    b.style.setProperty('--c', BEAD_COLORS[i % BEAD_COLORS.length])
    b.style.left = `${4 + Math.random() * 92}vw`
    b.style.setProperty('--fx', `${(Math.random() - 0.5) * 120}px`)
    b.style.setProperty('--fd', `${1.7 + Math.random() * 1.2}s`)
    b.style.setProperty('--fdelay', `${Math.random() * 0.4}s`)
    document.body.appendChild(b)
    setTimeout(() => b.remove(), 3200)
  }
}

/** 统一入口 */
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

async function regenerate() {
  if (!sourceFile.value) return
  await processSource(sourceFile.value, sourceInfo.value)
}

const boardCount = computed(() => {
  if (!pattern.value) return 0
  const { width, height } = pattern.value
  return Math.ceil(width / 29) * Math.ceil(height / 29)
})

const FLOAT_BEADS = [
  { x: '5%', y: '16%', c: '#ff4da6', s: 12, dur: '15s', dx: '26px', d: '-3s' },
  { x: '90%', y: '9%', c: '#ffed4e', s: 10, dur: '17s', dx: '-22px', d: '-7s' },
  { x: '12%', y: '52%', c: '#22e0ff', s: 9, dur: '16s', dx: '24px', d: '-10s' },
  { x: '86%', y: '46%', c: '#b87bff', s: 11, dur: '18s', dx: '-26px', d: '-5s' },
  { x: '8%', y: '80%', c: '#22e0ff', s: 8, dur: '14s', dx: '20px', d: '-8s' },
  { x: '92%', y: '76%', c: '#ff4da6', s: 10, dur: '19s', dx: '-18px', d: '-12s' },
]
</script>

<template>
  <!-- 鼠标跟随微光 -->
  <div ref="glowRef" class="cursor-glow" aria-hidden="true"></div>

  <!-- 背景零星拼豆粒子 -->
  <div class="bg-fx" aria-hidden="true">
    <div class="bg-blob b1"></div><div class="bg-blob b2"></div><div class="bg-blob b3"></div>
    <i v-for="(b, i) in FLOAT_BEADS" :key="i" class="float-bead"
       :style="{ '--x': b.x, '--y': b.y, '--c': b.c, '--s': b.s + 'px', '--dur': b.dur, '--dx': b.dx, '--delay': b.d }"></i>
  </div>

  <div class="topbar">
    <div class="logo"><i></i><i></i><i></i><i></i></div>
    <div>
      <h1>Perler Studio</h1>
      <div class="sub"><span class="emoji">✨</span> 拼豆图纸生成器 · 图片 / AI 一键出图纸</div>
    </div>
    <div class="spacer"></div>
    <button class="icon-btn" title="GitHub 仓库" @click="openGithub">🐙</button>
    <button class="icon-btn" :title="theme === 'dark' ? '切换浅色' : '切换深色'" @click="toggleTheme">{{ theme === 'dark' ? '☀️' : '🌙' }}</button>
  </div>

  <div class="container">
    <div class="mode-switch" style="--i:0">
      <button :class="{ active: mode === 'upload' }" @click="mode = 'upload'"><span class="em">🖼️</span> 图片转图纸</button>
      <button :class="{ active: mode === 'ai' }" @click="mode = 'ai'"><span class="em">✨</span> AI 生成</button>
    </div>

    <UploadCard v-if="mode === 'upload'" :processing="processing" @file="(f, info) => processSource(f, info)" @toast="toast" />
    <AICard v-else @image="(f, info) => processSource(f, info)" @toast="toast" />

    <SettingsCard v-model:params="params" :has-source="!!sourceFile" @regenerate="regenerate" />

    <PatternCard v-if="pattern" :pattern="pattern" :params="params" :board-count="boardCount" :source-info="sourceInfo" :source-thumb="sourceThumb" @toast="toast" />

    <div v-else class="card empty" style="--i:3">
      <div class="mini-beads"><span></span><span></span><span></span><span></span><span></span></div>
      <div>上传图片或 AI 生成图案，这里会出现你的拼豆图纸</div>
    </div>

    <div class="footer">
      数据全程在本地处理，不上传任何服务器 · 支持添加到主屏幕使用<br />
      开发者：涛涛 · <button class="link-btn" @click="showContact = true">📮 联系作者</button><br />
      <span class="magic">Craft pixel magic</span> <span class="px"><i></i><i></i><i></i></span>
    </div>
  </div>

  <ContactModal v-if="showContact" @close="showContact = false" />
  <AiSettingsModal v-if="showAiSettings" @close="showAiSettings = false" @toast="toast" />
  <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
</template>
