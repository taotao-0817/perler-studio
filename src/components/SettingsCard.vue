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
  { w: 20, h: 20, label: '20×20' },
  { w: 29, h: 29, label: '29×29 一板' },
  { w: 42, h: 42, label: '42×42' },
  { w: 50, h: 50, label: '50×50' },
  { w: 64, h: 64, label: '64×64' },
]
const MAX_COLORS = [
  { v: 0, label: '不限制' },
  { v: 8, label: '8 色' },
  { v: 16, label: '16 色' },
  { v: 24, label: '24 色' },
]

const dirty = ref(false)

// 参数变化 → 标记，1.2s 防抖后自动重新生成
watch(
  () => [props.params.gridW, props.params.gridH, props.params.maxColors, props.params.denoise],
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
  <div class="card">
    <h2><span class="no">2</span>图纸参数</h2>
    <p class="desc">调整后会自动重新生成图纸（示例里建议 29×29 起）</p>

    <div class="field">
      <label>图纸大小（格数）</label>
      <div class="seg">
        <button v-for="s in SIZES" :key="s.label"
                :class="{ active: params.gridW === s.w && params.gridH === s.h }"
                @click="setSize(s)">{{ s.label }}</button>
      </div>
    </div>

    <div class="field">
      <label>颜色数量（越少越好拼）</label>
      <div class="seg">
        <button v-for="c in MAX_COLORS" :key="c.v"
                :class="{ active: params.maxColors === c.v }"
                @click="params.maxColors = c.v">{{ c.label }}</button>
      </div>
    </div>

    <div class="switch-row">
      <div>
        <div class="lbl">✨ 降噪平滑</div>
        <div class="hint">去掉单点杂色，图纸更干净</div>
      </div>
      <div class="switch" :class="{ on: params.denoise }" @click="params.denoise = !params.denoise"></div>
    </div>

    <div v-if="dirty" style="font-size:12px;color:var(--accent);font-weight:600;text-align:center;padding-top:6px">
      ⏳ 参数已更新，正在重新生成…
    </div>
  </div>
</template>
