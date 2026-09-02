// 截图：联系作者弹窗（手机尺寸）
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9991
const PROFILE = 'C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-contact-shot'
fs.rmSync(PROFILE, { recursive: true, force: true })
const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  `--user-data-dir=${PROFILE}`, 'about:blank',
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
try {
  let targets
  for (let i = 0; i < 30; i++) { try { targets = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (targets.length) break } catch {} await sleep(500) }
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await cdp('Page.navigate', { url: 'https://taotao-0817.github.io/perler-studio/' })
  for (let i = 0; i < 20; i++) { await sleep(1000); if (await evalJs('!!document.querySelector("input[type=file]")')) break }
  // 滚到底部点击联系作者
  await evalJs(`document.querySelector('.footer')?.scrollIntoView()`)
  await sleep(800)
  await evalJs(`[...document.querySelectorAll('.footer button')].find(b => b.textContent.includes('联系作者'))?.click()`)
  await sleep(1500)
  // 滚动弹窗到微信二维码可见
  await evalJs(`document.querySelector('.wechat-qr')?.scrollIntoView({block:'center'})`)
  await sleep(600)
  const r = await cdp('Page.captureScreenshot', { format: 'png' })
  const out = 'C:/auto work/perler-studio/screenshots/05-contact.png'
  fs.writeFileSync(out, Buffer.from(r.data, 'base64'))
  console.log('📸 联系弹窗截图:', out)
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
