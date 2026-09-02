// 诊断：公网页面加载状态 + console 错误
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9666
const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-diag',
  'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
const consoleLogs = []
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
  if (r.exceptionDetails) return { error: r.exceptionDetails.exception?.description || r.exceptionDetails.text }
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
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
    }
    if (m.method === 'Runtime.exceptionThrown') {
      consoleLogs.push('EXCEPTION: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text))
    }
  })
  await cdp('Page.navigate', { url: 'https://taotao-0817.github.io/perler-studio/' })

  for (const wait of [3, 6, 10]) {
    await sleep(wait * 1000)
    const state = await evalJs(`(() => ({
      app: document.querySelector('#app')?.innerHTML?.slice(0, 120) || '(空)',
      hasInput: !!document.querySelector('input[type=file]'),
      cards: document.querySelectorAll('.card').length,
      swReady: !!navigator.serviceWorker?.controller,
      title: document.title,
      bodyLen: document.body.innerHTML.length
    }))()`)
    console.log(`等待 ${wait}s 后:`, JSON.stringify(state))
    if (state.cards > 0) break
  }
  if (consoleLogs.length) {
    console.log('\n--- 页面 console/异常 ---')
    consoleLogs.slice(-10).forEach((l) => console.log(l.slice(0, 300)))
  } else {
    console.log('\n(无 console 输出)')
  }
} catch (e) {
  console.error('❌', e.message)
} finally {
  try { ws?.close() } catch {}
  edge.kill()
}
