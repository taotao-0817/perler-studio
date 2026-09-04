import { spawn } from 'node:child_process'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9452
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-v3v', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(m, p = {}) { const id = Math.floor(Math.random() * 1e6); return new Promise((res, rej) => { const on = (ev) => { const d = JSON.parse(ev.data); if (d.id === id) { ws.removeEventListener('message', on); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result) } }; ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method: m, params: p })) }) }
async function ev(e) { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); return r.result?.value }
try {
  let t
  for (let i = 0; i < 30; i++) { try { t = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (t.length) break } catch {} await sleep(500) }
  const pg = t.find((x) => x.type === 'page'); ws = new WebSocket(pg.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Page.navigate', { url: 'http://localhost:4174/' })
  await sleep(2500)
  const first = await ev(`document.documentElement.getAttribute('data-theme')`)
  console.log('初始主题:', first)
  // 切深色
  await ev(`[...document.querySelectorAll('.topbar .icon-btn')].find(b=>b.textContent.includes('🌙'))?.click()`)
  await sleep(800)
  const dark = await ev(`document.documentElement.getAttribute('data-theme')`)
  console.log('切深色后:', dark, dark === 'dark' ? '✅' : '❌')
  // 功能：注入测试图出图纸
  await ev(`(async () => { const c=document.createElement('canvas');c.width=100;c.height=100;const x=c.getContext('2d');x.fillStyle='#FF5CA8';x.fillRect(0,0,100,100);const b=await new Promise(r=>c.toBlob(r,'image/png'));const dt=new DataTransfer();dt.items.add(new File([b],'t.png',{type:'image/png'}));const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await sleep(2500)
  const ok = await ev(`(() => { const c=document.querySelector('.preview-wrap canvas'); const s=document.querySelectorAll('.stats-table tbody tr').length; return { canvas:c?[c.width,c.height]:null, stats:s, glow:document.querySelectorAll('.cursor-glow').length, mini:document.querySelectorAll('.mini-beads').length } })()`)
  console.log('功能检查:', JSON.stringify(ok))
  console.log(ok.canvas && ok.stats > 0 ? '✅ v3 功能正常' : '❌ 功能异常')
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
