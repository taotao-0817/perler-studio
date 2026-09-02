// 多巴胺版截图：首页 / 图纸(抓撒豆) / AI页 / 联系弹窗
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9445
const OUT = 'C:/auto work/perler-studio/screenshots'
fs.mkdirSync(OUT, { recursive: true })
const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-v2',
  'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(method, params = {}) {
  const id = Math.floor(Math.random() * 1e6)
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) } }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evalJs(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  return r.result?.value
}
async function shot(name) {
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
  console.log('📸', name)
}
try {
  let targets
  for (let i = 0; i < 30; i++) { try { targets = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (targets.length) break } catch {} await sleep(500) }
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await cdp('Page.navigate', { url: 'http://localhost:4173/' })
  await sleep(3200)
  await shot('v2-01-home')

  // 注入图片 → 连拍抓撒豆
  await evalJs(`(async () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256
    const x = c.getContext('2d')
    x.fillStyle = '#4FC3F7'; x.fillRect(0,0,256,256)
    x.fillStyle = '#E23A2E'; x.beginPath()
    x.moveTo(128,220); x.bezierCurveTo(40,150,60,60,128,110); x.bezierCurveTo(196,60,216,150,128,220)
    x.fill()
    x.fillStyle = '#FDD21C'; x.beginPath(); x.arc(190,60,26,0,7); x.fill()
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    const file = new File([blob], 'test.png', { type: 'image/png' })
    const dt = new DataTransfer(); dt.items.add(file)
    const input = document.querySelector('input[type=file]')
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  // 撒豆在生成完成后触发，连拍捕捉
  await sleep(2100); await shot('v2-02-confetti-1')
  await sleep(650);  await shot('v2-03-confetti-2')
  await sleep(1500)
  await evalJs(`document.querySelector('.preview-wrap')?.scrollIntoView({block:'center'})`)
  await sleep(700)
  await shot('v2-04-pattern')

  // AI 页
  await evalJs(`[...document.querySelectorAll('.mode-switch button')].find(b => b.textContent.includes('AI'))?.click()`)
  await sleep(1100)
  await shot('v2-05-ai')

  // 联系弹窗
  await evalJs(`document.querySelector('.footer')?.scrollIntoView()`)
  await sleep(700)
  await evalJs(`[...document.querySelectorAll('.footer button')].find(b => b.textContent.includes('联系作者'))?.click()`)
  await sleep(1500)
  await evalJs(`document.querySelector('.wechat-qr')?.scrollIntoView({block:'center'})`)
  await sleep(700)
  await shot('v2-06-contact')
  console.log('✅ 截图完成')
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
