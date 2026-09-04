# -*- coding: utf-8 -*-
"""
OG 分享图（微信分享缩略图）1200×630
v3 多巴胺灵动高级风：深紫黑夜空 + 霓虹光斑 + 拼豆像素图 + 品牌字
输出: public/og-image.png
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
import shutil

OUT = r"C:\auto work\perler-studio\public\og-image.png"
URL = "https://taotao-0817.github.io/perler-studio/"

W, H = 1200, 630
PINK = (255, 77, 166)
CYAN = (34, 224, 255)
LEMON = (255, 237, 78)
VIOLET = (184, 123, 255)
WHITE = (255, 255, 255)
MUTED = (165, 162, 188)
BG_TOP = (24, 23, 42)
BG_BOT = (14, 14, 26)

FONT_B = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_R = r"C:\Windows\Fonts\msyh.ttc"
if not os.path.exists(FONT_B):
    FONT_B = r"C:\Windows\Fonts\simhei.ttf"
    FONT_R = FONT_B

def font(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)

# ---------- 背景：深紫黑 + 霓虹光斑 ----------
yy, xx = np.mgrid[0:H, 0:W]
t = yy / H
bg = np.zeros((H, W, 3))
bg[:,:,0] = BG_TOP[0] + (BG_BOT[0]-BG_TOP[0])*t
bg[:,:,1] = BG_TOP[1] + (BG_BOT[1]-BG_TOP[1])*t
bg[:,:,2] = BG_TOP[2] + (BG_BOT[2]-BG_TOP[2])*t
def glow(bg, cx, cy, color, R, s):
    d = np.sqrt((xx-cx)**2 + (yy-cy)**2)
    h = np.exp(-(d/R)**2) * s
    for k in range(3):
        bg[:,:,k] = np.clip(bg[:,:,k] + h*color[k], 0, 255)
glow(bg, W*0.95, H*0.10, PINK, 420, 0.95)
glow(bg, W*0.08, H*0.05, CYAN, 380, 0.5)
glow(bg, W*0.90, H*0.92, VIOLET, 400, 0.6)
glow(bg, W*0.15, H*0.95, LEMON, 380, 0.4)
img = Image.fromarray(bg.astype(np.uint8), 'RGB')
d = ImageDraw.Draw(img)

# ---------- 左上角小字 ----------
f_small = font(26, bold=False)
d.text((60, 46), "PERLER STUDIO", font=f_small, fill=(200, 198, 220))

# ---------- 左侧品牌主视觉 ----------
f_brand = font(88)
f_sub = font(36, bold=False)
f_hint = font(28, bold=False)
# 主标题（渐变映射到文字太复杂，用白字 + 粉色发丝笔触即可）
d.text((58, 96), "拼豆图纸", font=f_brand, fill=WHITE)
d.text((58, 196), "生成器", font=f_brand, fill=PINK)
# 渐变装饰线
for i in range(0, 300):
    frac = i/300
    col = tuple(int(PINK[k]*(1-frac) + VIOLET[k]*frac) for k in range(3))
    d.line([(58+i, 312), (58+i, 320)], fill=col, width=2)
# 副标题
d.text((58, 352), "上传图片 / AI 生成，一键变拼豆图纸", font=f_sub, fill=(230, 228, 245))
d.text((58, 420), "免费在线 · 手机点开即用", font=f_hint, fill=MUTED)
# 底部署名
d.text((58, 560), "开发者：涛涛", font=f_hint, fill=MUTED)

# ---------- 右侧：拼豆像素示例图 ----------
# 用拼豆色块拼一个"爱心"图案（约 12x12 格）
HEART_COLORS = [PINK, (255,77,166), (255,120,180), LEMON, CYAN, VIOLET]
heart = [
    ".XX....XX.",
    "XXXX..XXXX",
    "XXXXXXXXXX",
    "XXXXXXXXXX",
    ".XXXXXXXX.",
    "..XXXXXX..",
    "...XXXX...",
    "....XX....",
]
cell = 24
hx0, hy0 = 700, 150
for y, row in enumerate(heart):
    for x, ch in enumerate(row):
        if ch == "X":
            px = hx0 + x*cell
            py = hy0 + y*cell
            base = PINK if (x + y) % 2 == 0 else (255, 110, 175)
            d.rounded_rectangle([px, py, px+cell, py+cell], radius=cell*0.24, fill=base)
            d.rounded_rectangle([px+2, py+2, px+cell-2, py+cell-2], radius=cell*0.2, outline=(255, 200, 220), width=1)
# 小像素点（彩色豆）点缀在周边
dots = [(CYAN, 890, 120), (LEMON, 920, 420), (VIOLET, 840, 520), (CYAN, 1000, 190), (LEMON, 1060, 320)]
for col, px, py in dots:
    d.rounded_rectangle([px, py, px+26, py+26], radius=9, fill=col)

# ---------- 右侧底部：扫码即用 + 二维码(小) ----------
import qrcode, qrcode.constants
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=4, border=0)
qr.add_data(URL); qr.make(fit=True)
m = qr.get_matrix(); N = len(m)
qsz = 150
qcell = qsz // N
qpx = 950; qpy = 420
d.rounded_rectangle([qpx-10, qpy-10, qpx+qsz+10, qpy+qsz+10], radius=18, fill=WHITE)
for y in range(N):
    for x in range(N):
        if m[y][x]:
            d.rectangle([qpx+x*qcell, qpy+y*qcell, qpx+(x+1)*qcell, qpy+(y+1)*qcell], fill=(18,18,28))
f_scan = font(22, bold=False)
d.text((qpx-6, qpy+qsz+18), "扫码即用", font=f_scan, fill=MUTED)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG")
print("OG 图已生成:", OUT, img.size)
