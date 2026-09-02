<script setup>
// ============================================================
// UploadCard.vue — 图片上传（相册 / 拍照 / 拖拽 / 粘贴 / 示例）
// ============================================================
import { ref } from 'vue'

const props = defineProps({ processing: Boolean })
const emit = defineEmits(['file', 'toast'])

const dragOver = ref(false)
const fileInput = ref(null)

function handleFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    emit('toast', '请选择图片文件 📷')
    return
  }
  emit('file', file, { name: file.name || '上传图片' })
}

function onPick(e) {
  const f = e.target.files?.[0]
  if (f) handleFile(f)
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) handleFile(f)
}

function onPaste(e) {
  const items = e.clipboardData?.items || []
  for (const it of items) {
    if (it.type.startsWith('image/')) {
      handleFile(it.getAsFile())
      break
    }
  }
}

/** emoji 渲染成图片，作为示例（本地生成，不联网） */
function makeEmojiSample(emoji, size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)
  ctx.font = `${size * 0.82}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.02)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

const SAMPLES = [
  { emoji: '🐱', label: '像素猫' },
  { emoji: '💖', label: '爱心' },
  { emoji: '🌈', label: '彩虹' },
  { emoji: '🍓', label: '草莓' },
]

async function useSample(s) {
  if (props.processing) return
  try {
    const blob = await makeEmojiSample(s.emoji)
    const file = new File([blob], `${s.label}.png`, { type: 'image/png' })
    emit('file', file, { name: `${s.label}（示例）` })
  } catch {
    emit('toast', '示例生成失败，请直接上传图片')
  }
}
</script>

<template>
  <div class="card" data-step="1" style="--i:1" @paste="onPaste">
    <h2><span class="no">1</span>选择图案</h2>
    <p class="desc">上传任意图片（照片 / 截图 / 表情包都可以），支持拍照与拖拽</p>

    <div class="upload-zone" :class="{ drag: dragOver }"
         @click="fileInput.click()"
         @dragover.prevent="dragOver = true"
         @dragleave="dragOver = false"
         @drop.prevent="onDrop">
      <div class="big">🧩</div>
      <div class="t1">{{ processing ? '正在生成图纸…' : '点击选择图片' }}</div>
      <div class="t2">或拖拽图片到这里 · 也可 Ctrl+V 粘贴</div>
      <button class="btn-primary" :disabled="processing" style="pointer-events:none">
        {{ processing ? '⏳ 处理中…' : '📁 选择图片 / 拍照' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onPick" />
    </div>

    <div class="chips">
      <span style="font-size:12px;color:var(--muted);align-self:center">试试示例：</span>
      <button v-for="s in SAMPLES" :key="s.emoji" class="chip" :disabled="processing" @click="useSample(s)">
        {{ s.emoji }} {{ s.label }}
      </button>
    </div>
  </div>
</template>
