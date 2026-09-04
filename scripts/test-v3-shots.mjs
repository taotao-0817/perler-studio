// v3 多巴胺灵动高级风 截图：浅色首页 / 深色首页 / 图纸叠加
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9451
const OUT = 'C:/auto work/perler-studio/screenshots/v3'
fs.mkdirSync(OUT, { recursive: true })
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-v3', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(m, p = {}) { const id = Math.floor(Math.random() * 1e6); return new Promise((res, rej) => { const on = (ev) => { const d = JSON.parse(ev.data); if (d.id === id) { ws.removeEventListener('message', on); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result) } }; ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method: m, params: p })) }) }
async function ev(e) { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description || r.exceptionDetails.text }; return r.result?.value }
async function shot(name) { const r = await cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64')); console.log('📸', name) }
try {
  let t
  for (let i = 0; i < 30; i++) { try { t = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (t.length) break } catch {} await sleep(500) }
  const pg = t.find((x) => x.type === 'page'); ws = new WebSocket(pg.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await cdp('Page.navigate', { url: 'http://localhost:4174/' })
  await sleep(3000)
  await shot('03-v3-light')

  // 生成图纸（48 默认）→ 叠加截图
  await ev(`(async () => { const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle='#4FC3F7';x.fillRect(0,0,256,256);x.fillStyle='#E23A2E';x.beginPath();x.moveTo(128,220);x.bezierCurveTo(40,150,60,60,128,110);x.bezierCurveTo(196,60,216,150,128,220);x.fill();x.fillStyle='#FDD21C';x.beginPath();x.arc(190,60,26,0,7);x.fill();const b=await new Promise(r=>c.toBlob(r,'image/png'));const dt=new DataTransfer();dt.items.add(new File([b],'t.png',{type:'image/png'}));const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await sleep(2500)
  await shot('03-v3-pattern')
  await ev(`[...document.querySelectorAll('.preview-tools .chip')].find(c=>c.textContent.includes('叠加'))?.click()`)
  await sleep(800)
  await ev(`document.querySelector('.preview-wrap')?.scrollIntoView({block:'center'})`)
  await sleep(400)
  await shot('03-v3-overlay')

  // 切深色
  await ev(`[...document.querySelectorAll('.topbar .icon-btn')].find(b=>b.textContent.includes('🌙'))?.click()`)
  await sleep(1500)
  await shot('04-v3-dark')
  console.log('✅ v3 截图完成')
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
