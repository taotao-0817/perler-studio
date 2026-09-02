// 验证撒豆 confetti 触发
import { spawn } from 'node:child_process'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9446
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-cf', 'about:blank'], { stdio: 'ignore' })
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
  const jsErrors = []
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.method === 'Runtime.exceptionThrown') jsErrors.push(m.params.exceptionDetails.text)
  })
  await cdp('Page.navigate', { url: 'http://localhost:4173/' })
  await sleep(2500)
  await evalJs(`(async () => {
    const c = document.createElement('canvas'); c.width = 100; c.height = 100
    const x = c.getContext('2d'); x.fillStyle = '#FF5CA8'; x.fillRect(0,0,100,100)
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    const dt = new DataTransfer(); dt.items.add(new File([blob], 't.png', { type: 'image/png' }))
    const input = document.querySelector('input[type=file]')
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })()`)
  // 每 300ms 采样 confetti 数量，找峰值
  let peak = 0
  for (let i = 0; i < 12; i++) {
    await sleep(300)
    const n = await evalJs('document.querySelectorAll(".bead-c").length') || 0
    if (n > peak) peak = n
  }
  console.log('撒豆峰值数量:', peak, peak >= 10 ? '✅ 特效正常触发' : '❌ 未触发')
  console.log('JS 错误:', jsErrors.length ? jsErrors.join('; ') : '无 ✅')
} catch (e) { console.error('❌', e.message) } finally { try { ws?.close() } catch {} edge.kill() }
