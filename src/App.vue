<script setup>
// ============================================================
// App.vue — 拼豆图纸生成器主界面
// ============================================================
import { reactive, ref, computed } from 'vue'
import UploadCard from './components/UploadCard.vue'
import AICard from './components/AICard.vue'
import SettingsCard from './components/SettingsCard.vue'
import PatternCard from './components/PatternCard.vue'
import AiSettingsModal from './components/AiSettingsModal.vue'
import ContactModal from './components/ContactModal.vue'
import { fileToPattern } from './lib/pipeline.js'
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
  paletteId: 'perler',
})

const sourceInfo = ref(null) // { name, w, h }

function toast(msg) {
  toastMsg.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 2600)
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
      paletteId: params.paletteId,
    })
    p.paletteId = params.paletteId
    pattern.value = p
    sourceInfo.value = info
    sourceFile.value = file
    toast(`图纸生成成功！${p.width}×${p.height} 格，用了 ${p.stats.length} 种颜色`)
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
</script>

<template>
  <div class="topbar">
    <div class="logo"><i></i><i></i><i></i><i></i></div>
    <div>
      <h1>拼豆图纸生成器</h1>
      <div class="sub">Perler Studio · 图片 / AI 一键出图纸</div>
    </div>
    <div class="spacer"></div>
    <button class="icon-btn" title="AI 设置" @click="showAiSettings = true">⚙️</button>
  </div>

  <div class="container">
    <!-- 模式切换 -->
    <div class="mode-switch">
      <button :class="{ active: mode === 'upload' }" @click="mode = 'upload'">🖼️ 图片转图纸</button>
      <button :class="{ active: mode === 'ai' }" @click="mode = 'ai'">✨ AI 生成</button>
    </div>

    <!-- 第 1 步：来源 -->
    <UploadCard v-if="mode === 'upload'" :processing="processing" @file="(f, info) => processSource(f, info)" @toast="toast" />
    <AICard v-else @image="(f, info) => processSource(f, info)" @toast="toast" />

    <!-- 第 2 步：参数 -->
    <SettingsCard v-model:params="params" :has-source="!!sourceFile" @regenerate="regenerate" />

    <!-- 第 3 步：图纸 -->
    <PatternCard v-if="pattern" :pattern="pattern" :params="params" :board-count="boardCount" :source-info="sourceInfo" @toast="toast" />

    <div v-else class="card empty">
      <div class="big">🧩</div>
      上传图片或 AI 生成图案后，这里会出现你的拼豆图纸
    </div>

    <div class="footer">
      数据全程在本地处理，不上传任何服务器 · 支持添加到主屏幕使用<br />
      开发者：涛涛 · <button class="link-btn" @click="showContact = true">📮 联系作者</button><br />
      Perler Studio ❤️ 为拼豆爱好者制作
    </div>
  </div>

  <ContactModal v-if="showContact" @close="showContact = false" />
  <AiSettingsModal v-if="showAiSettings" @close="showAiSettings = false" @toast="toast" />
  <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
</template>
