// 公网最终验证：叠加视图 / 原图对比 / 色号(H3) / 更大网格
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9450
const URL = 'https://taotao-0817.github.io/perler-studio/'
const PROFILE = 'C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-final'
fs.rmSync(PROFILE, { recursive: true, force: true })
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(m, p = {}) { const id = Math.floor(Math.random() * 1e6); return new Promise((res, rej) => { const on = (ev) => { const d = JSON.parse(ev.data); if (d.id === id) { ws.removeEventListener('message', on); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result) } }; ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method: m, params: p })) }) }
async function ev(e) { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description || r.exceptionDetails.text }; return r.result?.value }
async function shot(name) { const r = await cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`C:/auto work/perler-studio/screenshots/${name}.png`, Buffer.from(r.data, 'base64')); console.log('📸', name) }
try {
  let t
  for (let i = 0; i < 30; i++) { try { t = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (t.length) break } catch {} await sleep(500) }
  const pg = t.find((x) => x.type === 'page'); ws = new WebSocket(pg.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await cdp('Page.navigate', { url: URL })
  for (let i = 0; i < 20; i++) { await sleep(1000); if (await ev('!!document.querySelector("input[type=file]")')) break }
  console.log('✅ Vue 挂载')

  // 注入测试图
  await ev(`(async () => { const c=document.createElement('canvas');c.width=120;c.height=120;const x=c.getContext('2d');x.fillStyle='#4FC3F7';x.fillRect(0,0,120,120);x.fillStyle='#E23A2E';x.beginPath();x.moveTo(60,100);x.bezierCurveTo(20,70,28,26,60,52);x.bezierCurveTo(92,26,100,70,60,100);x.fill();const b=await new Promise(r=>c.toBlob(r,'image/png'));const dt=new DataTransfer();dt.items.add(new File([b],'t.png',{type:'image/png'}));const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await sleep(2500)

  const check = await ev(`(() => {
    const chips = [...document.querySelectorAll('.preview-tools .chip')].map(c => c.textContent.trim())
    const lineNos = [...document.querySelectorAll('.line-no')].map(e => e.textContent)
    const segSizes = [...document.querySelectorAll('.seg')][0]?.querySelectorAll('button').length
    return { chips, lineNos: lineNos.slice(0,4), hasOverlay: chips.some(c=>c.includes('叠加')), hasOrig: chips.some(c=>c.includes('原图')), hasLine: lineNos.some(l=>l.startsWith('H')), segSizes }
  })()`)
  console.log('公网功能检查:', JSON.stringify(check, null, 2))

  // 截图：叠加模式 + 64网格
  await ev(`[...document.querySelectorAll('.preview-tools .chip')].find(c=>c.textContent.includes('叠加'))?.click()`)
  await sleep(800)
  await ev(`document.querySelector('.preview-wrap')?.scrollIntoView({block:'center'})`)
  await sleep(400)
  await shot('final-overlay')

  const pass = check.hasOverlay && check.hasOrig && check.hasLine && check.segSizes >= 5
  console.log(pass ? '\n✅ 公网最新版确认（叠加/原图/色号/大网格）' : '\n❌ 部分功能未命中')
  if (!pass) process.exitCode = 1
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
