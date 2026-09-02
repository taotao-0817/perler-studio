# -*- coding: utf-8 -*-
"""
生成拼豆风格分享海报二维码
设计：克莱因蓝主色 + 像素爱心 logo + 彩色拼豆边框 + 标题与署名
"""
from PIL import Image, ImageDraw, ImageFont
import qrcode
import qrcode.constants
import os

OUT_DIR = r"C:\auto work\perler-studio\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

URL = "https://taotao-0817.github.io/perler-studio/"

BLUE = (0, 47, 167)        # 克莱因蓝
WHITE = (255, 255, 255)
INK = (26, 30, 55)
BEADS = [(226, 58, 46), (253, 210, 28), (65, 168, 80), (255, 123, 172),
         (62, 111, 181), (139, 69, 181), (255, 138, 0), (244, 251, 244)]

FONT_B = r"C:\Windows\Fonts\msyhbd.ttc"   # 微软雅黑粗体
FONT_R = r"C:\Windows\Fonts\msyh.ttc"     # 微软雅黑常规
if not os.path.exists(FONT_B):
    FONT_B = r"C:\Windows\Fonts\simhei.ttf"
    FONT_R = FONT_B


def load_font(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)


# ---------- 1. 二维码矩阵（H 级纠错） ----------
qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=0,
)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()
N = len(matrix)  # 模块数（37 左右）
print(f"二维码: {N}x{N} 模块, H级纠错")

# 每个模块的像素尺寸（整体约 900px）
MOD = 22
CODE_PX = N * MOD
CODE_PAD = 90           # 二维码外留白（放拼豆装饰留白区）
CANVAS_W = CODE_PX + CODE_PAD * 2 + 80   # 海报宽（二维码区 + 标题区）
HEADER_H = 300          # 顶部标题区
FOOT_H = 210            # 底部署名区
CANVAS_H = HEADER_H + CODE_PX + CODE_PAD * 2 + FOOT_H

# 海报画布：白底
img = Image.new("RGB", (CANVAS_W, CANVAS_H), WHITE)
d = ImageDraw.Draw(img)

# ---------- 2. 顶部标题区（克莱因蓝圆角块背景） ----------
d.rounded_rectangle([30, 24, CANVAS_W - 30, HEADER_H - 12], radius=36, fill=BLUE)
f_title = load_font(86)
f_sub = load_font(34, bold=False)
t1 = "拼豆图纸生成器"
w1 = d.textlength(t1, font=f_title)
d.text(((CANVAS_W - w1) / 2, 72), t1, font=f_title, fill=WHITE)
sub = "Perler Studio · 图片 / AI 一键出图纸"
w2 = d.textlength(sub, font=f_sub)
d.text(((CANVAS_W - w2) / 2, 196), sub, font=f_sub, fill=(190, 205, 255))

# 标题左侧像素方块装饰
def pixel_block(x, y, size, color, gap=8):
    n = 3
    for i in range(n):
        for j in range(n):
            d.rounded_rectangle([x + i * (size + gap), y + j * (size + gap),
                                 x + i * (size + gap) + size, y + j * (size + gap) + size],
                                radius=size // 5, fill=color)

pixel_block(70, 66, 26, (253, 210, 28))
pixel_block(CANVAS_W - 70 - 26 * 3 - 16, 66, 26, (226, 58, 46))

# ---------- 3. 二维码主体（模块画成克莱因蓝圆角方块） ----------
QR_X = (CANVAS_W - CODE_PX) // 2
QR_Y = HEADER_H + CODE_PAD
for y in range(N):
    for x in range(N):
        if not matrix[y][x]:
            continue
        px = QR_X + x * MOD
        py = QR_Y + y * MOD
        # 定位角用实心大块，其余圆角
        d.rounded_rectangle([px, py, px + MOD, py + MOD], radius=MOD * 0.32, fill=BLUE)

# 定位角内芯（白色细描边增强风格）—— 略过，圆角方块已足够

# ---------- 4. 中心像素爱心 logo（覆盖 ~7x7 模块） ----------
HEART = [
    ".XX.XX.",
    "XXXXXXX",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    "...X...",
]
hcell = MOD
hx0 = QR_X + (N - len(HEART[0])) * MOD // 2
hy0 = QR_Y + (N - len(HEART)) * MOD // 2
# 白底圆盘遮住原模块
r = (len(HEART[0]) * MOD / 2) + 10
cx = hx0 + len(HEART[0]) * MOD / 2
cy = hy0 + len(HEART) * MOD / 2
d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE, outline=BLUE, width=4)
for i, row in enumerate(HEART):
    for j, ch in enumerate(row):
        if ch == "X":
            px = hx0 + j * hcell
            py = hy0 + i * hcell
            col = (226, 58, 46) if (i + j) % 3 == 0 else (255, 123, 172)
            d.rounded_rectangle([px, py, px + hcell, py + hcell], radius=hcell * 0.34, fill=col)

# ---------- 5. 底部信息区 ----------
f_url = load_font(40)
url = URL.replace("https://", "")
w3 = d.textlength(url, font=f_url)
d.text(((CANVAS_W - w3) / 2, CANVAS_H - FOOT_H + 12), url, font=f_url, fill=BLUE)
f_by = load_font(30)
by = "开发者：涛涛 · 扫码即刻开始拼豆"
w4 = d.textlength(by, font=f_by)
d.text(((CANVAS_W - w4) / 2, CANVAS_H - FOOT_H + 92), by, font=f_by, fill=INK)
f_hint = load_font(24, bold=False)
hint = "📱 手机扫码打开 · 免费使用"
w5 = d.textlength(hint, font=f_hint)
d.text(((CANVAS_W - w5) / 2, CANVAS_H - FOOT_H + 152), hint, font=f_hint, fill=(130, 135, 155))

# ---------- 6. 拼豆装饰边框（彩色圆角方块环） ----------
bead = 26
gap = 18
margin = 34
y = margin
for x in range(margin, CANVAS_W - bead - margin + 1, bead + gap):
    d.rounded_rectangle([x, y, x + bead, y + bead], radius=7, fill=BEADS[(x // (bead + gap)) % len(BEADS)])
    d.rounded_rectangle([x, CANVAS_H - bead - margin, x + bead, CANVAS_H - margin], radius=7, fill=BEADS[(x // (bead + gap) + 4) % len(BEADS)])
x = margin
for y in range(margin, CANVAS_H - bead - margin + 1, bead + gap):
    d.rounded_rectangle([x, y, x + bead, y + bead], radius=7, fill=BEADS[(y // (bead + gap) + 2) % len(BEADS)])
    d.rounded_rectangle([CANVAS_W - bead - margin, y, CANVAS_W - margin, y + bead], radius=7, fill=BEADS[(y // (bead + gap) + 6) % len(BEADS)])

out = os.path.join(OUT_DIR, "share-poster.png")
img.save(out)
print("海报已生成:", out, img.size)
