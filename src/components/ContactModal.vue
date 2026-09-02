<script setup>
// ============================================================
// ContactModal.vue — 联系作者：闲鱼小店 + 微信二维码
// 微信二维码图片放 public/wechat-qr.png（有则显示，无则自动隐藏）
// ============================================================
import { ref } from 'vue'

const emit = defineEmits(['close'])

const XIANYU_URL = 'https://m.tb.cn/h.8mFINC5?tk=TOAnTUim62G'
const qrSrc = `${import.meta.env.BASE_URL}wechat-qr.png`
const qrOk = ref(true)

function openUrl(url) {
  window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal">
      <button class="close-x" @click="emit('close')">✕</button>
      <h3>📮 联系作者 · 涛涛</h3>
      <p style="font-size:12.5px;color:var(--muted);margin:0 0 16px">
        喜欢这个拼豆小工具？找作者聊聊拼豆、定制图纸，或逛逛小店的周边～
      </p>

      <a :href="XIANYU_URL" target="_blank" rel="noopener" class="contact-card xy">
        <div class="cc-icon">🐟</div>
        <div class="cc-body">
          <div class="cc-title">闲鱼小店</div>
          <div class="cc-sub">淘拼豆、手作周边 · 点开看看</div>
        </div>
        <div class="cc-arrow">→</div>
      </a>

      <div v-if="qrOk" class="contact-card wechat">
        <div class="cc-icon">💬</div>
        <div class="cc-body">
          <div class="cc-title">微信 · 涛涛</div>
          <div class="cc-sub">长按识别二维码加好友</div>
        </div>
      </div>
      <img v-if="qrOk" :src="qrSrc" alt="微信二维码" class="wechat-qr" @error="qrOk = false" />

      <div class="btn-row" style="margin-top:16px">
        <button class="btn-ghost" @click="openUrl(XIANYU_URL)">🐟 打开闲鱼</button>
        <button class="btn-primary" @click="emit('close')">好的</button>
      </div>
    </div>
  </div>
</template>
