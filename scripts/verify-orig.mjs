import { spawn } from 'node:child_process'
import fs from 'node:fs'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9449
const SRC = 'C:/Users/不羡Rin、/AppData/Roaming/Hermes/composer-images/composer_2026-09-04_04-09-00-474_8a4821.jpg'
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-org', 'about:blank'], { stdio: 'ignore' })
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
  const b64 = fs.readFileSync(SRC).toString('base64')
  await ev(`(async () => { const bin=atob('${b64}');const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);const blob=new Blob([arr],{type:'image/jpeg'});const dt=new DataTransfer();dt.items.add(new File([blob],'头像.jpg',{type:'image/jpeg'}));const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await sleep(2500)
  await ev(`[...document.querySelectorAll('.preview-tools .chip')].find(c=>c.textContent.includes('原图'))?.click()`)
  await sleep(900)
  const orig = await ev(`(() => { const img=document.querySelector('.thumb-view'); const btn=[...document.querySelectorAll('.preview-tools .chip')].find(c=>c.textContent.includes('原图')); return { imgShown:!!img, srcLen:img?.src.length||0, active:btn?.classList.contains('active') } })()`)
  console.log('原图切换(真实图):', JSON.stringify(orig))
  console.log(orig.imgShown && orig.srcLen > 100 ? '✅ 原图对比正常显示' : '❌')
  if (!orig.imgShown) process.exitCode = 1
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
