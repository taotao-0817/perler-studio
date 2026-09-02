// ============================================================
// e2e 端到端测试：headless Edge + CDP
// 模拟：生成测试图片 → 塞进 file input → 触发 change
// 验证：图纸 canvas 渲染 + 统计表 + 导出按钮
// ============================================================
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
const EDGE = EDGE_CANDIDATES.find((p) => fs.existsSync(p))
if (!EDGE) { console.error('未找到 Edge'); process.exit(1) }

const PORT = 9333
const edge = spawn(EDGE, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--user-data-dir=C:/Users/不羡Rin、/AppData/Local/Temp/perler-edge-test',
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
  if (r.exceptionDetails) throw new Error('页面 JS 异常: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result?.value
}

try {
  // 等待调试端口
  let targets
  for (let i = 0; i < 30; i++) {
    try {
      targets = await (await fetch(`http://localhost:${PORT}/json`)).json()
      if (targets.length) break
    } catch { /* retry */ }
    await sleep(500)
  }
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('没有可用页面')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('Page.navigate', { url: 'http://localhost:4173/' })
  await sleep(2500)

  // 页面标题 & 关键结构
  const title = await evalJs('document.title')
  console.log('页面标题:', title)

  // 生成测试图片并注入 file input
  const inject = await evalJs(`(async () => {
    // 画一张 256x256 的测试图：蓝底 + 红色爱心 + 黄色圆
    const c = document.createElement('canvas'); c.width = 256; c.height = 256
    const x = c.getContext('2d')
    x.fillStyle = '#4FC3F7'; x.fillRect(0,0,256,256)
    x.fillStyle = '#E23A2E'; x.beginPath()
    x.moveTo(128,220); x.bezierCurveTo(40,150,60,60,128,110); x.bezierCurveTo(196,60,216,150,128,220)
    x.fill()
    x.fillStyle = '#FDD21C'; x.beginPath(); x.arc(190,60,26,0,7); x.fill()
    const blob = await new Promise(r => c.toBlob(r, 'image/png'))
    const file = new File([blob], 'test-heart.png', { type: 'image/png' })
    const dt = new DataTransfer(); dt.items.add(file)
    const input = document.querySelector('input[type=file]')
    if (!input) return 'NO_INPUT'
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return 'INJECTED'
  })()`)
  console.log('注入测试图片:', inject)

  // 等待处理
  await sleep(4000)

  // 验证图纸卡片出现
  const check = await evalJs(`(() => {
    const cards = [...document.querySelectorAll('.card')].map(c => c.querySelector('h2')?.textContent?.trim())
    const canvas = document.querySelector('.preview-wrap canvas')
    const statsRows = document.querySelectorAll('.stats-table tbody tr').length
    const btns = [...document.querySelectorAll('.btn-row button')].map(b => b.textContent.trim())
    return {
      cards, canvasSize: canvas ? [canvas.width, canvas.height] : null,
      statsRows, exportBtns: btns,
      previewImg: !!document.querySelector('.ai-result img'),
      toast: document.querySelector('.toast')?.textContent || ''
    }
  })()`)
  console.log('图纸卡片:', JSON.stringify(check, null, 2))

  // 切换符号模式 & 网格
  const symbol = await evalJs(`(() => {
    const chips = [...document.querySelectorAll('.preview-tools .chip')]
    const sym = chips.find(c => c.textContent.includes('符号'))
    sym.click()
    return true
  })()`)
  await sleep(800)
  const afterSymbol = await evalJs(`(() => {
    const c = document.querySelector('.preview-wrap canvas')
    const ctx = c.getContext('2d')
    const px = ctx.getImageData(2, 2, 1, 1).data
    return { size: [c.width, c.height], samplePixel: [px[0],px[1],px[2]] }
  })()`)
  console.log('符号模式 canvas:', JSON.stringify(afterSymbol))

  console.log('\n✅ E2E 测试完成')
} catch (e) {
  console.error('❌ E2E 失败:', e.message)
  process.exitCode = 1
} finally {
  try { ws?.close() } catch {}
  edge.kill()
}
