<script setup>
// ============================================================
// AICard.vue — AI 生成图案（智谱免费额度 / 自定义接口）
// ============================================================
import { ref } from 'vue'
import { generateImage, loadProviderSettings } from '../lib/ai.js'

const emit = defineEmits(['image', 'toast'])

const prompt = ref('一只戴耳机的小猫，像素风头像')
const size = ref('1024x1024')
const busy = ref(false)
const resultUrl = ref('')
const resultBlob = ref(null)
const needKey = ref(false)

const STYLES = [
  { tag: '可爱卡通', text: 'cute cartoon style' },
  { tag: '像素游戏风', text: '8-bit retro pixel game sprite style' },
  { tag: '动漫头像', text: 'anime avatar portrait, simple' },
  { tag: '简约线稿', text: 'minimal line art, clean' },
  { tag: '动物', text: 'cute animal' },
]
const activeStyle = ref('可爱卡通')

function getStyleText() {
  return STYLES.find((s) => s.tag === activeStyle.value)?.text || ''
}

async function onGenerate() {
  if (!prompt.value.trim()) {
    emit('toast', '先写一句你想生成的图案描述 ✍️')
    return
  }
  busy.value = true
  needKey.value = false
  resultUrl.value = ''
  resultBlob.value = null
  try {
    const settings = loadProviderSettings()
    const chosen = settings.lastProvider || 'zhipu'
    const blob = await generateImage(chosen, settings, `${prompt.value}, ${getStyleText()}`, size.value)
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
    emit('toast', 'AI 图案生成成功！自动转换成拼豆图纸 🎉')
    // 自动送入管线
    emit('image', new File([blob], `AI_${Date.now()}.png`, { type: 'image/png' }), { name: 'AI 生成图案' })
  } catch (e) {
    if (e.message.includes('API Key')) {
      needKey.value = true
      emit('toast', '需要先配置 AI 接口的 Key（见设置）')
    } else {
      emit('toast', e.message)
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="card">
    <h2><span class="no">1</span>AI 生成图案</h2>
    <p class="desc">用一句话描述想要的图案，AI 生成后自动转为拼豆图纸</p>

    <div class="field">
      <label>图案描述</label>
      <textarea v-model="prompt" placeholder="例：一只戴耳机的小猫、像素风、可爱" :disabled="busy" />
    </div>

    <div class="field">
      <label>风格</label>
      <div class="prompt-tags">
        <button v-for="s in STYLES" :key="s.tag" class="prompt-tag"
                :class="{ active: activeStyle === s.tag }" :disabled="busy" @click="activeStyle = s.tag">
          {{ s.tag }}
        </button>
      </div>
    </div>

    <div class="field">
      <label>生成尺寸（越大细节越多）</label>
      <div class="seg">
        <button :class="{ active: size === '512x512' }" :disabled="busy" @click="size = '512x512'">512 · 快</button>
        <button :class="{ active: size === '1024x1024' }" :disabled="busy" @click="size = '1024x1024'">1024 · 精细</button>
      </div>
    </div>

    <button class="btn-primary" :disabled="busy" @click="onGenerate">
      {{ busy ? '⏳ AI 生成中（约 10~30 秒）…' : '✨ 生成图案并出图纸' }}
    </button>

    <div v-if="busy" class="ai-loading">
      <div class="spin"></div>
      正在绘制你的图案，请稍候…
    </div>

    <div v-if="needKey" class="hint-box">
      📌 使用 AI 生成需要先配置接口 Key：点击右上角 <b>⚙️ 设置</b>，按引导免费注册智谱开放平台并填入 Key（有免费额度），或填入你自己的 OpenAI 兼容接口。
    </div>

    <div v-if="resultUrl && !busy" class="ai-result">
      <img :src="resultUrl" alt="AI 生成结果" />
      <p style="font-size:12px;color:var(--muted);margin-top:6px">已自动生成图纸，下滑查看 ↓</p>
    </div>
  </div>
</template>
