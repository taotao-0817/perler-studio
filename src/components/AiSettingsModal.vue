<script setup>
// ============================================================
// AiSettingsModal.vue — AI 接口设置（Key 仅存本机）
// ============================================================
import { ref } from 'vue'
import { loadProviderSettings, saveProviderSettings, PROVIDERS, testConnection } from '../lib/ai.js'

const emit = defineEmits(['close', 'toast'])

const settings = ref(loadProviderSettings())
const active = ref(settings.value.lastProvider || 'zhipu')
const testing = ref(false)

function save() {
  settings.value.lastProvider = active.value
  saveProviderSettings(settings.value)
  emit('toast', '设置已保存 ✅')
}

async function onTest() {
  testing.value = true
  try {
    const r = await testConnection(active.value, settings.value)
    emit('toast', r.msg)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal">
      <button class="close-x" @click="emit('close')">✕</button>
      <h3>🤖 AI 生成设置</h3>
      <p style="font-size:12.5px;color:var(--muted);margin:0 0 10px">
        Key 只保存在你自己的浏览器里，请求直接发送到对应平台，不会经过任何中转服务器。
      </p>

      <div class="seg" style="margin-bottom:14px">
        <button :class="{ active: active === 'zhipu' }" @click="active = 'zhipu'">智谱（免费额度）</button>
        <button :class="{ active: active === 'custom' }" @click="active = 'custom'">自定义接口</button>
      </div>

      <!-- 智谱 -->
      <template v-if="active === 'zhipu'">
        <div class="hint-box">
          🎁 <b>智谱 CogView 有免费额度</b>（无需绑卡），适合国内用户。<br />
          ① 打开 <a :href="PROVIDERS.zhipu.keyUrl" target="_blank" rel="noopener">open.bigmodel.cn</a> 注册账号<br />
          ② 进入「控制台 → API Keys」创建 Key<br />
          ③ 把 Key 复制到下面输入框即可<br />
          <span style="opacity:0.75">额度用完后可继续充值使用，或换自定义接口。</span>
        </div>
        <div class="field">
          <label>智谱 API Key</label>
          <input type="password" v-model="settings.zhipu.key" placeholder="sk-..." autocomplete="off" />
        </div>
        <p style="font-size:11.5px;color:var(--muted);margin:4px 0 0">模型：{{ PROVIDERS.zhipu.model }}（{{ PROVIDERS.zhipu.name }}）</p>
      </template>

      <!-- 自定义 -->
      <template v-else>
        <div class="hint-box">
          🔌 任意 <b>OpenAI 兼容</b> 的图像生成接口（POST /images/generations）：
          硅基流动 SiliconFlow、阿里通义、本地服务等。需支持 <code>CORS</code> 浏览器直连。
        </div>
        <div class="field">
          <label>Base URL（如 https://api.siliconflow.cn/v1）</label>
          <input type="url" v-model="settings.custom.baseUrl" placeholder="https://api.example.com/v1" />
        </div>
        <div class="field">
          <label>模型名</label>
          <input type="text" v-model="settings.custom.model" placeholder="如 black-forest-labs/FLUX.1-schnell / qwen-image" />
        </div>
        <div class="field">
          <label>API Key</label>
          <input type="password" v-model="settings.custom.key" placeholder="sk-..." autocomplete="off" />
        </div>
      </template>

      <div class="btn-row">
        <button class="btn-ghost" :disabled="testing" @click="onTest">{{ testing ? '测试中…' : '🔌 测试连接' }}</button>
        <button class="btn-primary" @click="save">💾 保存</button>
      </div>
    </div>
  </div>
</template>
