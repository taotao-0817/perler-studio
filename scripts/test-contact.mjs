// 生产验证 v3：footer 署名 + 联系作者弹窗 + 闲鱼链接
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9990
const URL = 'https://taotao-0817.github.io/perler-studio/'
const PROFILE = 'C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-contact'
fs.rmSync(PROFILE, { recursive: true, force: true })

const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  `--user-data-dir=${PROFILE}`, 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(method, params = {}) {
  const id = Math.floor(Math.random() * 1e6)
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evalJs(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) return { __err: r.exceptionDetails.exception?.description || r.exceptionDetails.text }
  return r.result?.value
}

try {
  let targets
  for (let i = 0; i < 30; i++) {
    try { targets = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (targets.length) break } catch {}
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  await cdp('Page.navigate', { url: URL })

  let ok = false
  for (let i = 0; i < 30; i++) {
    await sleep(1000)
    ok = (await evalJs('!!document.querySelector("input[type=file]")')) === true
    if (ok) break
  }
  if (!ok) { console.log('❌ Vue 未挂载'); process.exitCode = 1 }
  else {
    console.log('✅ Vue 挂载完成')

    const footer = await evalJs(`(() => {
      const f = document.querySelector('.footer')?.textContent || ''
      return { hasName: f.includes('涛涛'), hasContact: f.includes('联系作者') }
    })()`)
    console.log('footer 署名:', JSON.stringify(footer), footer.hasName && footer.hasContact ? '✅' : '❌')

    // 点击联系作者
    const clicked = await evalJs(`(() => {
      const btn = [...document.querySelectorAll('.footer button')].find(b => b.textContent.includes('联系作者'))
      if (!btn) return false
      btn.click()
      return true
    })()`)
    await sleep(1500)
    const modal = await evalJs(`(() => {
      const m = document.querySelector('.modal')
      if (!m) return null
      const text = m.textContent
      const xy = m.querySelector('a.contact-card')
      return {
        title: m.querySelector('h3')?.textContent,
        hasXianyu: text.includes('闲鱼小店'),
        xianyuHref: xy?.getAttribute('href') || '',
        hasWechat: text.includes('微信 · 涛涛'),
        hasBtn: text.includes('打开闲鱼'),
      }
    })()`)
    console.log('联系弹窗:', JSON.stringify(modal, null, 2))
    const pass = modal && modal.hasXianyu && modal.xianyuHref.includes('m.tb.cn') && modal.hasBtn
    console.log(pass ? '\n✅ 联系作者功能验证通过！' : '\n❌ 弹窗验证失败')
    if (!pass) process.exitCode = 1
  }
} catch (e) {
  console.error('❌', e.message)
  process.exitCode = 1
} finally {
  try { ws?.close() } catch {}
  edge.kill()
}
