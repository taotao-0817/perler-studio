import { spawn } from 'node:child_process'
import fs from 'node:fs'
const EDGE_CANDIDATES = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe']
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9777
const edge = spawn(EDGE, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-diag2', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
async function cdp(method, params = {}) {
  const id = Math.floor(Math.random() * 1e6)
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) } }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
  })
}
try {
  let targets
  for (let i = 0; i < 30; i++) { try { targets = await (await fetch(`http://localhost:${PORT}/json`)).json(); if (targets.length) break } catch {} await sleep(500) }
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  await cdp('Page.enable'); await cdp('Runtime.enable')
  // 捕获完整异常
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.method === 'Runtime.exceptionThrown') {
      const ex = m.params.exceptionDetails
      console.log('=== 完整异常 ===')
      console.log('text:', ex.text)
      console.log('exception:', JSON.stringify(ex.exception?.preview || ex.exception?.description, null, 2))
      console.log('stack:', JSON.stringify(ex.stackTrace?.callFrames?.slice(0, 8), null, 2))
      if (ex.url) console.log('url:', ex.url, 'line:', ex.lineNumber, 'col:', ex.columnNumber)
    }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
      console.log(`[console.${m.params.type}]`, m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500))
    }
    if (m.method === 'Network.loadingFailed') {
      console.log('[网络失败]', m.params.errorText, m.params.blockedReason || '', m.params.canceled ? '(已取消)' : '')
    }
  })
  await cdp('Network.enable')
  await cdp('Page.navigate', { url: 'https://taotao-0817.github.io/perler-studio/' })
  await sleep(8000)
  const state = await cdp('Runtime.evaluate', { expression: 'document.querySelector("#app")?.innerHTML?.length || 0', returnByValue: true })
  console.log('最终 #app 内容长度:', state.result.value)
} catch (e) { console.error('❌', e.message) } finally { try { ws?.close() } catch {} edge.kill() }
