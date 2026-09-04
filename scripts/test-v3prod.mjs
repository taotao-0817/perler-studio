// v3 生产环境最终验证：主题切换/画布霓虹边/迷你豆/按钮扫光/功能
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9453
const URL = 'https://taotao-0817.github.io/perler-studio/'
const PROFILE = 'C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-v3prod'
fs.rmSync(PROFILE, { recursive: true, force: true })
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
  `--user-data-dir=${PROFILE}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(m, p = {}) { const id = Math.floor(Math.random() * 1e6); return new Promise((res, rej) => { const on = (ev) => { const d = JSON.parse(ev.data); if (d.id === id) { ws.removeEventListener('message', on); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result) } }; ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method: m, params: p })) }) }
async function ev(e) { const r = await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description || r.exceptionDetails.text }; return r.result?.value }
try {
  let t
  for (let i = 0; i < 30; i++) { try { t = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (t.length) break } catch {} await sleep(500) }
  const pg = t.find((x) => x.type === 'page'); ws = new WebSocket(pg.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Page.navigate', { url: URL })
  for (let i = 0; i < 20; i++) { await sleep(1000); if (await ev('!!document.querySelector("input[type=file]")')) break }

  const header = await ev(`(() => ({
    title: document.querySelector('.topbar h1')?.textContent,
    themeBtns: [...document.querySelectorAll('.topbar .icon-btn')].map(b=>b.textContent.trim()),
    miniBeads: document.querySelectorAll('.mini-beads span').length,
    cursorGlow: document.querySelectorAll('.cursor-glow').length
  }))()`)
  console.log('顶栏/空状态:', JSON.stringify(header))

  // 切深色
  await ev(`[...document.querySelectorAll('.topbar .icon-btn')].find(b=>b.textContent.includes('🌙'))?.click()`)
  await sleep(900)
  const theme = await ev(`document.documentElement.getAttribute('data-theme')`)
  console.log('主题切换:', theme, theme === 'dark' ? '✅' : '❌')

  // 注入图出图纸
  await ev(`(async () => { const c=document.createElement('canvas');c.width=160;c.height=160;const x=c.getContext('2d');x.fillStyle='#FFED4E';x.fillRect(0,0,160,160);x.fillStyle='#FF4DA6';x.beginPath();x.arc(80,80,50,0,7);x.fill();const b=await new Promise(r=>c.toBlob(r,'image/png'));const dt=new DataTransfer();dt.items.add(new File([b],'t.png',{type:'image/png'}));const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await sleep(3000)
  const fn = await ev(`(() => {
    const canvas = document.querySelector('.preview-wrap canvas')
    const pw = document.querySelector('.preview-wrap')
    const anim = pw ? getComputedStyle(pw).animationName : ''
    const lineNos = [...document.querySelectorAll('.line-no')].map(e=>e.textContent)
    return { canvas: canvas ? [canvas.width, canvas.height] : null, borderAnim: anim, lineNos: lineNos.slice(0,3) }
  })()`)
  console.log('功能+画布霓虹边:', JSON.stringify(fn))

  const pass = header.title === 'Perler Studio' && header.miniBeads === 5 && theme === 'dark' && fn.canvas && fn.borderAnim.includes('gradient-border') && fn.lineNos.length > 0
  console.log(pass ? '\n✅✅ v3 正式版生产验证全部通过！' : '\n❌ 部分未命中')
  if (!pass) process.exitCode = 1
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
