<script setup>
// ============================================================
// SettingsCard.vue — 图纸参数（改完自动重新生成）
// ============================================================
import { ref, watch } from 'vue'

const props = defineProps({
  params: { type: Object, required: true },
  hasSource: Boolean,
})
const emit = defineEmits(['update:params', 'regenerate'])

const SIZES = [
  { w: 29, h: 29, label: '29×29 一板' },
  { w: 40, h: 40, label: '40×40' },
  { w: 48, h: 48, label: '48×48' },
  { w: 64, h: 64, label: '64×64' },
  { w: 80, h: 80, label: '80×80 高清' },
]
const MAX_COLORS = [
  { v: 0, label: '不限制' },
  { v: 8, label: '8 色' },
  { v: 16, label: '16 色' },
  { v: 24, label: '24 色' },
  { v: 36, label: '36 色' },
]

const dirty = ref(false)

watch(
  () => [props.params.gridW, props.params.gridH, props.params.maxColors, props.params.denoise, props.params.useClustering],
  () => {
    if (!props.hasSource) return
    dirty.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      dirty.value = false
      emit('regenerate')
    }, 1200)
  }
)
let timer = null

function setSize(s) {
  props.params.gridW = s.w
  props.params.gridH = s.h
}
</script>

<template>
  <div class="card" data-step="2" style="--i:2">
    <h2><span class="no">2</span>图纸参数</h2>
    <p class="desc">格子越大越清晰还原原图，颜色越少越好拼（调完自动重新生成）</p>

    <div class="field">
      <label>图纸大小（格数）</label>
      <div class="seg">
        <button v-for="s in SIZES" :key="s.label"
                :class="{ active: params.gridW === s.w && params.gridH === s.h }"
                @click="setSize(s)">{{ s.label }}</button>
      </div>
    </div>

    <div class="field">
      <label>颜色数量</label>
      <div class="seg">
        <button v-for="c in MAX_COLORS" :key="c.v"
                :class="{ active: params.maxColors === c.v }"
                @click="params.maxColors = c.v">{{ c.label }}</button>
      </div>
    </div>

    <div class="switch-row">
      <div>
        <div class="lbl">🧠 主色聚类优化</div>
        <div class="hint">提取原图真实主色去杂色，更拟合原图（推荐开）</div>
      </div>
      <div class="switch" :class="{ on: params.useClustering }" @click="params.useClustering = !params.useClustering"></div>
    </div>

    <div class="switch-row">
      <div>
        <div class="lbl">✨ 去噪平滑</div>
        <div class="hint">只去除孤立杂点，保留形状细节</div>
      </div>
      <div class="switch" :class="{ on: params.denoise }" @click="params.denoise = !params.denoise"></div>
    </div>

    <div v-if="dirty" style="font-size:12px;color:var(--accent);font-weight:600;text-align:center;padding-top:6px">
      ⏳ 参数已更新，正在重新生成…
    </div>
  </div>
</template>
