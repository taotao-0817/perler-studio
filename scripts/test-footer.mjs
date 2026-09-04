// 验证 footer 品牌语 + ⚙️ AI 设置按钮
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9454
const URL = 'https://taotao-0817.github.io/perler-studio/'
const PROFILE = 'C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-foot'
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

  const foot = await ev(`(() => { const f = document.querySelector('.footer')?.textContent || ''; return { hasBrand: f.includes('为拼豆爱好者制作') && f.includes('Perler Studio'), hasMagic: f.includes('Craft pixel magic') } })()`)
  console.log('footer:', JSON.stringify(foot), foot.hasBrand ? '✅ 品牌语回来了' : '❌')

  // 顶栏 ⚙️
  const gear = await ev(`(() => { const btns=[...document.querySelectorAll('.topbar .icon-btn')].map(b=>({t:b.textContent.trim(), title:b.title})); const g = [...document.querySelectorAll('.topbar .icon-btn')].find(b=>b.textContent.includes('⚙️')); if(g) g.click(); return { btns } })()`)
  await sleep(1200)
  const modal = await ev(`(() => { const m = document.querySelector('.modal'); return { aiModalOpen: !!m, title: m?.querySelector('h3')?.textContent } })()`)
  console.log('顶栏按钮:', JSON.stringify(gear.btns))
  console.log('AI 设置弹窗:', JSON.stringify(modal), modal.aiModalOpen && modal.title?.includes('AI') ? '✅ 设置按钮生效' : '❌')

  const pass = foot.hasBrand && gear.btns.some(b => b.t.includes('⚙️')) && modal.aiModalOpen
  console.log(pass ? '\n✅ 两项均已恢复并验证' : '\n❌ 有遗漏')
  if (!pass) process.exitCode = 1
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
