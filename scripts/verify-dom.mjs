import { spawn } from 'node:child_process'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9448
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-dom', 'about:blank'], { stdio: 'ignore' })
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
  await cdp('Page.navigate', { url: 'http://localhost:4173/' })
  await sleep(2500)
  // 用 canvas 生成测试图
  await ev(`(async () => { const c=document.createElement('canvas');c.width=80;c.height=80;const x=c.getContext('2d');x.fillStyle='#222';x.fillRect(0,0,80,80);x.fillStyle='#F00';x.fillRect(10,10,60,60);const b=await new Promise(r=>c.toBlob(r,'image/png'));const dt=new DataTransfer();dt.items.add(new File([b],'t.png',{type:'image/png'}));const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await sleep(2500)
  // 检查色号列 + 视图chip + 原图按钮
  const check = await ev(`(() => {
    const lineNos = [...document.querySelectorAll('.line-no')].map(e => e.textContent)
    const chips = [...document.querySelectorAll('.preview-tools .chip')].map(c => c.textContent.trim())
    const hasOrig = !!document.querySelector('.preview-tools .chip')
    return { lineNos: lineNos.slice(0, 5), chips, thumb: (() => { try { document.querySelectorAll('.preview-tools .chip').find(c=>c.textContent.includes('原图'))?.click(); } catch{} return true })() }
  })()`)
  await sleep(900)
  const orig = await ev(`(() => {
    const img = document.querySelector('.thumb-view')
    const txt = [...document.querySelectorAll('.preview-tools .chip')].find(c=>c.textContent.includes('原图'))
    return { imgShown: !!img, origActive: txt?.classList.contains('active') }
  })()`)
  console.log('色号列前5:', JSON.stringify(check.lineNos))
  console.log('视图chips:', JSON.stringify(check.chips))
  console.log('原图切换:', JSON.stringify(orig))
  const pass = check.lineNos.some(l => l.startsWith('H')) && orig.imgShown
  console.log(pass ? '✅ DOM 验证通过（色号+原图对比）' : '❌')
  if (!pass) process.exitCode = 1
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
