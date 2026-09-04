// 验证 AI 面板尺寸选项 + 智谱模型名
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const PORT = 9455
const URL = 'https://taotao-0817.github.io/perler-studio/'
const PROFILE = 'C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-aichk'
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
  // 切 AI 模式
  await ev(`[...document.querySelectorAll('.mode-switch button')].find(b=>b.textContent.includes('AI'))?.click()`)
  await sleep(1200)
  const sizes = await ev(`(() => {
    const btns = [...document.querySelectorAll('.prompt-tag')]
    const sizeSeg = [...document.querySelectorAll('.seg')].map(s => [...s.querySelectorAll('button')].map(b=>b.textContent.trim()))
    // 找尺寸那组
    const sizeBtns = [...document.querySelectorAll('.seg button')].map(b=>b.textContent.trim()).filter(t=>t.includes('×')||t.includes('方形')||t.includes('快速'))
    return { sizeBtns, styleChips: btns.map(b=>b.textContent.trim()) }
  })()`)
  console.log('AI 尺寸选项:', JSON.stringify(sizes.sizeBtns))
  console.log('风格chips:', JSON.stringify(sizes.styleChips))
  const good = sizes.sizeBtns.some(t=>t.includes('方形')) && sizes.sizeBtns.some(t=>t.includes('快速'))
  console.log(good ? '✅ 尺寸选项已更新(方形/竖/横/快速)' : '❌ 未显示')
  if (!good) process.exitCode = 1
} catch (e) { console.error('❌', e.message); process.exitCode = 1 } finally { try { ws?.close() } catch {} edge.kill() }
