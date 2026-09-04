// ============================================================
// ai.js — AI 生图客户端
// 1) 智谱 CogView-3-Flash（国内免费额度，OpenAI 兼容格式）
// 2) 自定义 OpenAI 兼容接口（硅基流动 / 通义 / 任意 base_url）
// key 只保存在本机浏览器 localStorage，请求直接发往对应 API
// ============================================================

const LS_KEY = 'perler_ai_providers_v1'

export const PROVIDERS = {
  zhipu: {
    id: 'zhipu',
    name: '智谱 CogView（推荐·免费额度）',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'cogview-3-flash',
    keyUrl: 'https://open.bigmodel.cn/',
    keyHint: '注册智谱开放平台 → 控制台 → API Keys 免费获取',
    free: true,
  },
  custom: {
    id: 'custom',
    name: '自定义 OpenAI 兼容接口',
    baseUrl: '',
    model: '',
    keyHint: '任意 OpenAI 兼容 /v1/images/generations 服务（如硅基流动 SiliconFlow、通义等）',
    free: false,
  },
}

/** 智谱 CogView-3-Flash 官方支持的尺寸枚举 */
export const ZHIPU_SIZES = [
  '1024x1024', '768x1024', '1024x768',
  '1344x768', '768x1344', '864x1152', '1152x864',
  '1440x960', '960x1440', '512x512',
]

/** 判断错误信息是否属于"尺寸不合法"，若是则换尺寸重试 */
function isSizeError(msg) {
  return /size|尺寸|512|2880|整数倍|像素|resolution/i.test(String(msg))
}

export function loadProviderSettings() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || { zhipu: { key: '' }, custom: { key: '', baseUrl: '', model: '' } }
  } catch {
    return { zhipu: { key: '' }, custom: { key: '', baseUrl: '', model: '' } }
  }
}

export function saveProviderSettings(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s))
}

/**
 * 调用图像生成 API（含尺寸自适应重试）
 * @param {string} providerId 'zhipu' | 'custom'
 * @param {object} settings 保存的 key 配置
 * @param {string} prompt
 * @param {string} size 期望尺寸（若不受支持会自动尝试其他尺寸）
 * @returns {Promise<Blob>} 生成的图片 blob
 */
export async function generateImage(providerId, settings, prompt, size = '1024x1024') {
  const cfg = providerId === 'zhipu' ? PROVIDERS.zhipu : PROVIDERS.custom
  const saved = settings[providerId] || {}
  const apiKey = (saved.key || '').trim()
  if (!apiKey) throw new Error(providerId === 'zhipu'
    ? '还没有填写智谱 API Key —— 免费注册后到"AI 设置"里填入即可（见设置页引导）'
    : '请先在"AI 设置"里填写自定义接口的 API Key')

  const baseUrl = providerId === 'zhipu' ? cfg.baseUrl : (saved.baseUrl || '').trim().replace(/\/+$/, '')
  const model = providerId === 'zhipu' ? cfg.model : (saved.model || '').trim()
  if (!baseUrl) throw new Error('自定义接口缺少 Base URL')
  if (!model) throw new Error('自定义接口缺少模型名')

  // 拼豆图案更适合方形；对绘图模型加风格提示
  const fullPrompt = `flat pixel-art style design for perler bead craft, clean bold shapes, clear outlines, no text watermark, ${prompt}`

  // 尺寸候选：优先用户期望的，再补充智谱支持的其他尺寸（出错时依次尝试）
  const sizeCandidates = [size, ...(providerId === 'zhipu' ? ZHIPU_SIZES.filter((s) => s !== size) : [])]

  let lastErr = ''
  for (const sz of sizeCandidates) {
    try {
      const resp = await fetch(`${baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, prompt: fullPrompt, size: sz, n: 1 }),
      })

      if (resp.ok) {
        const data = await resp.json()
        const item = data.data?.[0]
        if (!item) throw new Error('AI 返回异常：没有图片数据')
        // 两种返回格式：url 或 b64_json
        let blob
        if (item.b64_json) {
          const bin = atob(item.b64_json)
          const arr = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
          blob = new Blob([arr], { type: 'image/png' })
        } else if (item.url) {
          const r = await fetch(item.url)
          if (!r.ok) throw new Error('图片下载失败')
          blob = await r.blob()
        } else {
          throw new Error('AI 返回异常：未知格式')
        }
        return blob
      }

      // 解析错误
      let msg = `HTTP ${resp.status}`
      try {
        const j = await resp.json()
        msg = j.error?.message || j.message || msg
      } catch { /* ignore */ }
      lastErr = msg

      // 若非尺寸错误，直接抛出，不再尝试其它尺寸
      if (!isSizeError(msg)) break
      // 是尺寸错误 → 换下一个尺寸继续
    } catch (e) {
      // 网络等异常，直接抛
      if (/Failed to fetch|NetworkError|CORS/i.test(e.message)) throw new Error('网络请求失败，请检查网络或该接口是否支持浏览器直连（CORS）')
      throw e
    }
  }
  throw new Error(`AI 生图失败：${lastErr || '所有尺寸均不受支持'}`)
}

/** 测试连接：发一个智谱支持的最小尺寸请求验证 key 是否有效 */
export async function testConnection(providerId, settings) {
  try {
    await generateImage(providerId, settings, 'a tiny solid red square', '512x512')
    return { ok: true, msg: '连接成功！Key 有效 ✅' }
  } catch (e) {
    return { ok: false, msg: e.message }
  }
}
