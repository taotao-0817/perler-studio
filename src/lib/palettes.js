// ============================================================
// palettes.js — 拼豆标准色板（带主流色号编码）
// 色号体系：字母(H)+数字，按色彩分类编号，黑色=H3
//   H1-9 黑/白/灰 | H10-19 红粉 | H20-29 橙黄 | H30-39 绿
//   H40-49 蓝紫 | H50-59 棕 | H60-69 霓虹 | H70-79 夜光 | H80-89 透明
// 架构支持多品牌扩展：可加 Hama / Mard / COCO
// ============================================================

const PERLER_COLORS = [
  // —— 黑白灰类 H1-9 ——
  { id: 'p-white', line: 'H1', name: 'White', nameZh: '白色', hex: '#FDFDFD' },
  { id: 'p-cream', line: 'H2', name: 'Cream', nameZh: '奶油', hex: '#F7EECB' },
  { id: 'p-black', line: 'H3', name: 'Black', nameZh: '黑色', hex: '#1A1A1A' },
  { id: 'p-gray', line: 'H4', name: 'Gray', nameZh: '灰色', hex: '#8C8C8C' },
  { id: 'p-lt-gray', line: 'H5', name: 'Light Gray', nameZh: '浅灰', hex: '#C6C6C6' },
  { id: 'p-dk-gray', line: 'H6', name: 'Dark Gray', nameZh: '深灰', hex: '#5A5A5A' },
  { id: 'p-silver', line: 'H7', name: 'Silver', nameZh: '银色', hex: '#BDC2C9' },
  { id: 'p-gold', line: 'H8', name: 'Gold', nameZh: '金色', hex: '#D4A017' },
  { id: 'p-albino', line: 'H9', name: 'Albino', nameZh: '奶白', hex: '#F3EBDC' },
  // —— 红粉类 H10-19 ——
  { id: 'p-red', line: 'H10', name: 'Red', nameZh: '红色', hex: '#E23A2E' },
  { id: 'p-dark-red', line: 'H11', name: 'Dark Red', nameZh: '深红', hex: '#A61B29' },
  { id: 'p-cranapple', line: 'H12', name: 'Cranapple', nameZh: '蔓越莓', hex: '#B0243F' },
  { id: 'p-pink', line: 'H13', name: 'Pink', nameZh: '粉色', hex: '#FF7BAC' },
  { id: 'p-bubblegum', line: 'H14', name: 'Bubblegum', nameZh: '泡泡糖粉', hex: '#FFA7C4' },
  { id: 'p-pastel-pink', line: 'H15', name: 'Pastel Pink', nameZh: '粉彩粉', hex: '#FFD4DF' },
  { id: 'p-hot-coral', line: 'H16', name: 'Hot Coral', nameZh: '珊瑚红', hex: '#FF6F5E' },
  { id: 'p-magenta', line: 'H17', name: 'Magenta', nameZh: '品红', hex: '#E0007E' },
  { id: 'p-fuchsia', line: 'H18', name: 'Fuchsia', nameZh: '紫红', hex: '#C2008A' },
  { id: 'p-plum', line: 'H19', name: 'Plum', nameZh: '梅紫', hex: '#7B2D5C' },
  // —— 橙黄类 H20-29 ——
  { id: 'p-orange', line: 'H20', name: 'Orange', nameZh: '橙色', hex: '#FF8A00' },
  { id: 'p-rust', line: 'H21', name: 'Rust', nameZh: '铁锈红', hex: '#B85C1C' },
  { id: 'p-hot-coral2', line: 'H22', name: 'Hot Coral', nameZh: '珊瑚橙', hex: '#FF7F50' },
  { id: 'p-cheddar', line: 'H23', name: 'Cheddar', nameZh: '切达黄', hex: '#F5A623' },
  { id: 'p-butterscotch', line: 'H24', name: 'Butterscotch', nameZh: '奶油糖', hex: '#E8A33D' },
  { id: 'p-yellow', line: 'H25', name: 'Yellow', nameZh: '黄色', hex: '#FDD21C' },
  { id: 'p-pastel-yellow', line: 'H26', name: 'Pastel Yellow', nameZh: '粉彩黄', hex: '#FFF6B0' },
  { id: 'p-peach', line: 'H27', name: 'Peach', nameZh: '桃色', hex: '#FFC9A0' },
  { id: 'p-sand', line: 'H28', name: 'Sand', nameZh: '沙色', hex: '#E5D3B3' },
  // —— 绿类 H30-39 ——
  { id: 'p-green', line: 'H30', name: 'Green', nameZh: '绿色', hex: '#41A850' },
  { id: 'p-lt-green', line: 'H31', name: 'Light Green', nameZh: '浅绿', hex: '#A6D9A0' },
  { id: 'p-dk-green', line: 'H32', name: 'Dark Green', nameZh: '深绿', hex: '#17663D' },
  { id: 'p-evergreen', line: 'H33', name: 'Evergreen', nameZh: '常青绿', hex: '#2C5E3A' },
  { id: 'p-parrot-green', line: 'H34', name: 'Parrot Green', nameZh: '鹦鹉绿', hex: '#3D8B37' },
  { id: 'p-pastel-green', line: 'H35', name: 'Pastel Green', nameZh: '粉彩绿', hex: '#C8E8B0' },
  { id: 'p-bright-green', line: 'H36', name: 'Bright Green', nameZh: '亮绿', hex: '#00C848' },
  { id: 'p-toothpaste', line: 'H37', name: 'Toothpaste', nameZh: '薄荷绿', hex: '#A8E4C0' },
  { id: 'p-kiwi-lime', line: 'H38', name: 'Kiwi Lime', nameZh: '猕猴桃绿', hex: '#A8C000' },
  // —— 蓝紫类 H40-49 ——
  { id: 'p-blue', line: 'H40', name: 'Blue', nameZh: '蓝色', hex: '#3E6FB5' },
  { id: 'p-lt-blue', line: 'H41', name: 'Light Blue', nameZh: '浅蓝', hex: '#6FC3E8' },
  { id: 'p-dk-blue', line: 'H42', name: 'Dark Blue', nameZh: '深蓝', hex: '#1B2D7F' },
  { id: 'p-pastel-blue', line: 'H43', name: 'Pastel Blue', nameZh: '粉彩蓝', hex: '#A9D7F0' },
  { id: 'p-purple', line: 'H44', name: 'Purple', nameZh: '紫色', hex: '#8B45B5' },
  { id: 'p-lavender', line: 'H45', name: 'Lavender', nameZh: '薰衣草紫', hex: '#C1A7D9' },
  { id: 'p-pastel-lavender', line: 'H46', name: 'Pastel Lavender', nameZh: '粉彩紫', hex: '#DCC8E8' },
  { id: 'p-periwinkle', line: 'H47', name: 'Periwinkle', nameZh: '长春花蓝', hex: '#8B96D9' },
  // —— 棕类 H50-59 ——
  { id: 'p-brown', line: 'H50', name: 'Brown', nameZh: '棕色', hex: '#8B5A2B' },
  { id: 'p-dk-brown', line: 'H51', name: 'Dark Brown', nameZh: '深棕', hex: '#4F3116' },
  { id: 'p-lt-brown', line: 'H52', name: 'Light Brown', nameZh: '浅棕', hex: '#A97C50' },
  { id: 'p-tan', line: 'H53', name: 'Tan', nameZh: '棕褐', hex: '#D7A66C' },
  // —— 霓虹类 H60-69 ——
  { id: 'p-neon-yellow', line: 'H60', name: 'Neon Yellow', nameZh: '霓虹黄', hex: '#E6FF00' },
  { id: 'p-neon-orange', line: 'H61', name: 'Neon Orange', nameZh: '霓虹橙', hex: '#FF6E00' },
  { id: 'p-neon-pink', line: 'H62', name: 'Neon Pink', nameZh: '霓虹粉', hex: '#FF2E88' },
  { id: 'p-neon-green', line: 'H63', name: 'Neon Green', nameZh: '霓虹绿', hex: '#39FF14' },
  { id: 'p-neon-blue', line: 'H64', name: 'Neon Blue', nameZh: '霓虹蓝', hex: '#2E9CFF' },
  { id: 'p-neon-purple', line: 'H65', name: 'Neon Purple', nameZh: '霓虹紫', hex: '#B400E6' },
  { id: 'p-neon-red', line: 'H66', name: 'Neon Red', nameZh: '霓虹红', hex: '#FF1E00' },
  // —— 夜光类 H70-79 ——
  { id: 'p-glow-white', line: 'H70', name: 'Glow White', nameZh: '夜光白', hex: '#E8F4E0' },
  { id: 'p-glow-green', line: 'H71', name: 'Glow Green', nameZh: '夜光绿', hex: '#B8E8A0' },
  { id: 'p-glow-blue', line: 'H72', name: 'Glow Blue', nameZh: '夜光蓝', hex: '#A0D8E8' },
  { id: 'p-glow-yellow', line: 'H73', name: 'Glow Yellow', nameZh: '夜光黄', hex: '#F0E8A0' },
  // —— 透明类 H80-89 ——
  { id: 'p-clear', line: 'H80', name: 'Transparent', nameZh: '透明', hex: '#E8F0F4' },
  { id: 'p-t-red', line: 'H81', name: 'Transparent Red', nameZh: '透明红', hex: '#F0C8C8' },
  { id: 'p-t-pink', line: 'H82', name: 'Transparent Pink', nameZh: '透明粉', hex: '#F0D0DC' },
  { id: 'p-t-orange', line: 'H83', name: 'Transparent Orange', nameZh: '透明橙', hex: '#F0DCC8' },
  { id: 'p-t-yellow', line: 'H84', name: 'Transparent Yellow', nameZh: '透明黄', hex: '#F0E8C0' },
  { id: 'p-t-green', line: 'H85', name: 'Transparent Green', nameZh: '透明绿', hex: '#D0E8D0' },
  { id: 'p-t-blue', line: 'H86', name: 'Transparent Blue', nameZh: '透明蓝', hex: '#C8DCF0' },
  { id: 'p-t-purple', line: 'H87', name: 'Transparent Purple', nameZh: '透明紫', hex: '#E0D0F0' },
]

export const PALETTES = [
  {
    id: 'perler',
    brand: 'Perler',
    brandZh: 'Perler 标准色',
    note: '美国 Perler 官方常规色卡（约 70 色，含主流色号编码）',
    colors: PERLER_COLORS,
  },
]

export function getPalette(id = 'perler') {
  return PALETTES.find((p) => p.id === id) || PALETTES[0]
}
