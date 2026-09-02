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
 * 调用图像生成 API
 * @param {string} providerId 'zhipu' | 'custom'
 * @param {object} settings 保存的 key 配置
 * @param {string} prompt
 * @param {string} size '1024x1024' | '512x512'
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

  const resp = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt: fullPrompt, size, n: 1 }),
  })

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      const j = await resp.json()
      msg = j.error?.message || j.message || msg
    } catch { /* ignore */ }
    throw new Error(`AI 生图失败：${msg}`)
  }

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

/** 测试连接：发一个 1x1 的极简请求验证 key 是否有效（部分平台可能没有最小尺寸，忽略失败） */
export async function testConnection(providerId, settings) {
  try {
    await generateImage(providerId, settings, 'a tiny solid red square', '256x256')
    return { ok: true, msg: '连接成功！' }
  } catch (e) {
    return { ok: false, msg: e.message }
  }
}
