// ============================================================
// palettes.js — 拼豆标准色板
// Perler 官方常规色卡（色名 + 标准 RGB 值，公开事实数据）
// 架构支持多品牌扩展：以后可加 Hama / Mard / COCO
// ============================================================

const PERLER_COLORS = [
  // —— 基础色 ——
  { id: 'p-white', name: 'White', nameZh: '白色', hex: '#FDFDFD' },
  { id: 'p-cream', name: 'Cream', nameZh: '奶油', hex: '#F7EECB' },
  { id: 'p-albino', name: 'Albino', nameZh: '奶白', hex: '#F3EBDC' },
  { id: 'p-black', name: 'Black', nameZh: '黑色', hex: '#1A1A1A' },
  { id: 'p-gray', name: 'Gray', nameZh: '灰色', hex: '#8C8C8C' },
  { id: 'p-lt-gray', name: 'Light Gray', nameZh: '浅灰', hex: '#C6C6C6' },
  { id: 'p-dk-gray', name: 'Dark Gray', nameZh: '深灰', hex: '#5A5A5A' },
  { id: 'p-silver', name: 'Silver', nameZh: '银色', hex: '#BDC2C9' },
  { id: 'p-gold', name: 'Gold', nameZh: '金色', hex: '#D4A017' },
  // —— 红粉系 ——
  { id: 'p-red', name: 'Red', nameZh: '红色', hex: '#E23A2E' },
  { id: 'p-dark-red', name: 'Dark Red', nameZh: '深红', hex: '#A61B29' },
  { id: 'p-cranapple', name: 'Cranapple', nameZh: '蔓越莓', hex: '#B0243F' },
  { id: 'p-pink', name: 'Pink', nameZh: '粉色', hex: '#FF7BAC' },
  { id: 'p-bubblegum', name: 'Bubblegum', nameZh: '泡泡糖粉', hex: '#FFA7C4' },
  { id: 'p-pastel-pink', name: 'Pastel Pink', nameZh: '粉彩粉', hex: '#FFD4DF' },
  { id: 'p-hot-coral', name: 'Hot Coral', nameZh: '珊瑚红', hex: '#FF6F5E' },
  { id: 'p-magenta', name: 'Magenta', nameZh: '品红', hex: '#E0007E' },
  { id: 'p-fuchsia', name: 'Fuchsia', nameZh: '紫红', hex: '#C2008A' },
  { id: 'p-plum', name: 'Plum', nameZh: '梅紫', hex: '#7B2D5C' },
  // —— 橙黄系 ——
  { id: 'p-orange', name: 'Orange', nameZh: '橙色', hex: '#FF8A00' },
  { id: 'p-rust', name: 'Rust', nameZh: '铁锈红', hex: '#B85C1C' },
  { id: 'p-hot-coral2', name: 'Hot Coral', nameZh: '珊瑚橙', hex: '#FF7F50' },
  { id: 'p-cheddar', name: 'Cheddar', nameZh: '切达黄', hex: '#F5A623' },
  { id: 'p-butterscotch', name: 'Butterscotch', nameZh: '奶油糖', hex: '#E8A33D' },
  { id: 'p-yellow', name: 'Yellow', nameZh: '黄色', hex: '#FDD21C' },
  { id: 'p-pastel-yellow', name: 'Pastel Yellow', nameZh: '粉彩黄', hex: '#FFF6B0' },
  { id: 'p-peach', name: 'Peach', nameZh: '桃色', hex: '#FFC9A0' },
  { id: 'p-sand', name: 'Sand', nameZh: '沙色', hex: '#E5D3B3' },
  // —— 绿系 ——
  { id: 'p-green', name: 'Green', nameZh: '绿色', hex: '#41A850' },
  { id: 'p-lt-green', name: 'Light Green', nameZh: '浅绿', hex: '#A6D9A0' },
  { id: 'p-dk-green', name: 'Dark Green', nameZh: '深绿', hex: '#17663D' },
  { id: 'p-evergreen', name: 'Evergreen', nameZh: '常青绿', hex: '#2C5E3A' },
  { id: 'p-parrot-green', name: 'Parrot Green', nameZh: '鹦鹉绿', hex: '#3D8B37' },
  { id: 'p-pastel-green', name: 'Pastel Green', nameZh: '粉彩绿', hex: '#C8E8B0' },
  { id: 'p-bright-green', name: 'Bright Green', nameZh: '亮绿', hex: '#00C848' },
  { id: 'p-toothpaste', name: 'Toothpaste', nameZh: '薄荷绿', hex: '#A8E4C0' },
  { id: 'p-kiwi-lime', name: 'Kiwi Lime', nameZh: '猕猴桃绿', hex: '#A8C000' },
  // —— 蓝紫系 ——
  { id: 'p-blue', name: 'Blue', nameZh: '蓝色', hex: '#3E6FB5' },
  { id: 'p-lt-blue', name: 'Light Blue', nameZh: '浅蓝', hex: '#6FC3E8' },
  { id: 'p-dk-blue', name: 'Dark Blue', nameZh: '深蓝', hex: '#1B2D7F' },
  { id: 'p-pastel-blue', name: 'Pastel Blue', nameZh: '粉彩蓝', hex: '#A9D7F0' },
  { id: 'p-purple', name: 'Purple', nameZh: '紫色', hex: '#8B45B5' },
  { id: 'p-lavender', name: 'Lavender', nameZh: '薰衣草紫', hex: '#C1A7D9' },
  { id: 'p-pastel-lavender', name: 'Pastel Lavender', nameZh: '粉彩紫', hex: '#DCC8E8' },
  { id: 'p-periwinkle', name: 'Periwinkle', nameZh: '长春花蓝', hex: '#8B96D9' },
  // —— 棕系 ——
  { id: 'p-brown', name: 'Brown', nameZh: '棕色', hex: '#8B5A2B' },
  { id: 'p-dk-brown', name: 'Dark Brown', nameZh: '深棕', hex: '#4F3116' },
  { id: 'p-lt-brown', name: 'Light Brown', nameZh: '浅棕', hex: '#A97C50' },
  { id: 'p-tan', name: 'Tan', nameZh: '棕褐', hex: '#D7A66C' },
  // —— 霓虹系（Neon）——
  { id: 'p-neon-yellow', name: 'Neon Yellow', nameZh: '霓虹黄', hex: '#E6FF00' },
  { id: 'p-neon-orange', name: 'Neon Orange', nameZh: '霓虹橙', hex: '#FF6E00' },
  { id: 'p-neon-pink', name: 'Neon Pink', nameZh: '霓虹粉', hex: '#FF2E88' },
  { id: 'p-neon-green', name: 'Neon Green', nameZh: '霓虹绿', hex: '#39FF14' },
  { id: 'p-neon-blue', name: 'Neon Blue', nameZh: '霓虹蓝', hex: '#2E9CFF' },
  { id: 'p-neon-purple', name: 'Neon Purple', nameZh: '霓虹紫', hex: '#B400E6' },
  { id: 'p-neon-red', name: 'Neon Red', nameZh: '霓虹红', hex: '#FF1E00' },
  // —— 夜光系（Glow in the Dark）——
  { id: 'p-glow-white', name: 'Glow White', nameZh: '夜光白', hex: '#E8F4E0' },
  { id: 'p-glow-green', name: 'Glow Green', nameZh: '夜光绿', hex: '#B8E8A0' },
  { id: 'p-glow-blue', name: 'Glow Blue', nameZh: '夜光蓝', hex: '#A0D8E8' },
  { id: 'p-glow-yellow', name: 'Glow Yellow', nameZh: '夜光黄', hex: '#F0E8A0' },
  // —— 透明系（Transparent）——
  { id: 'p-clear', name: 'Transparent', nameZh: '透明', hex: '#E8F0F4' },
  { id: 'p-t-red', name: 'Transparent Red', nameZh: '透明红', hex: '#F0C8C8' },
  { id: 'p-t-pink', name: 'Transparent Pink', nameZh: '透明粉', hex: '#F0D0DC' },
  { id: 'p-t-orange', name: 'Transparent Orange', nameZh: '透明橙', hex: '#F0DCC8' },
  { id: 'p-t-yellow', name: 'Transparent Yellow', nameZh: '透明黄', hex: '#F0E8C0' },
  { id: 'p-t-green', name: 'Transparent Green', nameZh: '透明绿', hex: '#D0E8D0' },
  { id: 'p-t-blue', name: 'Transparent Blue', nameZh: '透明蓝', hex: '#C8DCF0' },
  { id: 'p-t-purple', name: 'Transparent Purple', nameZh: '透明紫', hex: '#E0D0F0' },
]

export const PALETTES = [
  {
    id: 'perler',
    brand: 'Perler',
    brandZh: 'Perler 标准色',
    note: '美国 Perler 官方常规色卡（约 70 色）',
    colors: PERLER_COLORS,
  },
]

/** 常用拼豆板规格（颗数） */
export const BOARD_SIZES = [
  { id: 'mini', name: '迷你板', w: 10, h: 10 },
  { id: 'small', name: '小方板', w: 13, h: 13 },
  { id: 'square', name: '大方板', w: 29, h: 29 },
  { id: 'rect', name: '长方板', w: 29, h: 29 },
  { id: 'hex', name: '六角大板', w: 29, h: 29 },
]

export function getPalette(id = 'perler') {
  return PALETTES.find((p) => p.id === id) || PALETTES[0]
}
