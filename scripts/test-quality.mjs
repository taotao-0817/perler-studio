// 用用户的真实头像图，对比不同网格尺寸的图纸质量 + 抓撒豆
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9447
const SRC = 'C:/Users/不羡Rin、/AppData/Roaming/Hermes/composer-images/composer_2026-09-04_04-09-00-474_8a4821.jpg'
const OUT = 'C:/auto work/perler-studio/screenshots'
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-q', 'about:blank'], { stdio: 'ignore' })
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
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description || r.exceptionDetails.text }
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
  await sleep(3000)

  // 注入真实头像图
  const b64 = fs.readFileSync(SRC).toString('base64')
  await evalJs(`(async () => {
    const bin = atob('${b64}')
    const arr = new Uint8Array(bin.length)
    for (let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i)
    const blob = new Blob([arr], {type:'image/jpeg'})
    const file = new File([blob], '头像.jpg', {type:'image/jpeg'})
    const dt = new DataTransfer(); dt.items.add(file)
    const input = document.querySelector('input[type=file]')
    input.files = dt.files
    input.dispatchEvent(new Event('change', {bubbles:true}))
  })()`)
  await sleep(2500)
  await shot('q-01-29grid')

  // 切到 48×48 + 24色聚类
  await evalJs(`(() => {
    const segs = [...document.querySelectorAll('.seg')]
    // 第一组 seg 是大小
    const sizeBtns = segs[0].querySelectorAll('button')
    sizeBtns[2].click() // 48x48
  })()`)
  await sleep(2600)
  await evalJs(`document.querySelector('.preview-wrap')?.scrollIntoView({block:'center'})`)
  await sleep(500)
  await shot('q-02-48grid')

  // 64×64 高清
  await evalJs(`(() => {
    const segs = [...document.querySelectorAll('.seg')]
    const sizeBtns = segs[0].querySelectorAll('button')
    sizeBtns[3].click() // 64x64
  })()`)
  await sleep(3000)
  await evalJs(`document.querySelector('.preview-wrap')?.scrollIntoView({block:'center'})`)
  await sleep(500)
  await shot('q-03-64grid')

  // 叠加模式 + 原图对比
  await evalJs(`[...document.querySelectorAll('.preview-tools .chip')].find(c => c.textContent.includes('叠加'))?.click()`)
  await sleep(900)
  await shot('q-04-overlay')
  await evalJs(`[...document.querySelectorAll('.preview-tools .chip')].find(c => c.textContent.includes('原图'))?.click()`)
  await sleep(900)
  await shot('q-05-original')
  console.log('✅ 完成')
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
