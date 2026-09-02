// 截图脚本：主页面 + 生成图纸后页面（手机尺寸 390x844）
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9444
const OUT_DIR = 'C:/auto work/perler-studio/screenshots'
fs.mkdirSync(OUT_DIR, { recursive: true })

const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
  '--window-size=390,844',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-shot',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(method, params = {}) {
  const id = Math.floor(Math.random() * 1e6)
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) }
    }
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
  fs.writeFileSync(`${OUT_DIR}/${name}.png`, Buffer.from(r.data, 'base64'))
  console.log('📸', name)
}

try {
  let targets
  for (let i = 0; i < 30; i++) {
    try { targets = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (targets.length) break } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await cdp('Page.navigate', { url: 'http://localhost:4173/' })
  await sleep(3000)
  await shot('01-home')

  // 注入测试图片 → 出图纸 → 截图
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
  await sleep(4000)
  // 滚到图纸卡片
  await evalJs(`document.querySelector('.preview-wrap')?.scrollIntoView({block:'center'})`)
  await sleep(800)
  await shot('02-pattern')

  // AI 模式
  await evalJs(`[...document.querySelectorAll('.mode-switch button')].find(b => b.textContent.includes('AI')).click()`)
  await sleep(1000)
  await shot('03-ai')
  console.log('✅ 截图完成 →', OUT_DIR)
} catch (e) {
  console.error('❌', e.message); process.exitCode = 1
} finally {
  try { ws?.close() } catch {}
  edge.kill()
}
