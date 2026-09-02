// 生产环境验证：公网 URL 加载 → 注入测试图片 → 图纸渲染
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
const PORT = 9555
const URL = 'https://taotao-0817.github.io/perler-studio/'

const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-first-run',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-prod',
  'about:blank',
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
  if (r.exceptionDetails) throw new Error('页面异常: ' + (r.exceptionDetails.exception?.description || '未知'))
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
  await sleep(5000)

  const title = await evalJs('document.title')
  console.log('页面标题:', title)

  // 注入测试图
  const inject = await evalJs(`(async () => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 200
    const x = c.getContext('2d')
    x.fillStyle = '#41A850'; x.fillRect(0,0,200,200)
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(100,100,60,0,7); x.fill()
    x.fillStyle = '#002FA7'; x.font = 'bold 70px sans-serif'; x.textAlign='center'; x.textBaseline='middle'
    x.fillText('拼', 100, 108)
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    const file = new File([blob], 'prod-test.png', { type: 'image/png' })
    const dt = new DataTransfer(); dt.items.add(file)
    const input = document.querySelector('input[type=file]')
    if (!input) return 'NO_INPUT'
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return 'INJECTED'
  })()`)
  console.log('注入:', inject)
  await sleep(5000)

  const check = await evalJs(`(() => {
    const canvas = document.querySelector('.preview-wrap canvas')
    const stats = document.querySelectorAll('.stats-table tbody tr').length
    const title3 = [...document.querySelectorAll('.card h2')].map(h => h.textContent.trim())
    return { canvas: canvas ? [canvas.width, canvas.height] : null, stats, cards: title3 }
  })()`)
  console.log('生产环境图纸:', JSON.stringify(check))

  console.log(check.canvas && check.stats > 0 ? '\n✅ 生产环境验证通过！' : '\n❌ 生产环境验证失败')
} catch (e) {
  console.error('❌ 验证失败:', e.message)
  process.exitCode = 1
} finally {
  try { ws?.close() } catch {}
  edge.kill()
}
