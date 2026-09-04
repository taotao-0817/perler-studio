# -*- coding: utf-8 -*-
"""
v3 灵动高级感分享海报
深紫黑底 + 四角霓虹光斑 + 白底霓虹描边二维码 + 像素拼豆装饰
配色对齐 v3：霓虹桃粉 #ff4da6 / 青蓝 #22e0ff / 柠檬黄 #ffed4e / 薰衣草紫 #b87bff
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import qrcode, qrcode.constants
import os

OUT_DIR = r"C:\auto work\perler-studio\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)
URL = "https://taotao-0817.github.io/perler-studio/"

# 配色
PINK = (255, 77, 166)
CYAN = (34, 224, 255)
LEMON = (255, 237, 78)
VIOLET = (184, 123, 255)
WHITE = (255, 255, 255)
BG_TOP = (23, 22, 40)
BG_BOT = (14, 14, 26)
TEXT = (240, 238, 252)
MUTED = (155, 152, 178)

FONT_B = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_R = r"C:\Windows\Fonts\msyh.ttc"
if not os.path.exists(FONT_B):
    FONT_B = r"C:\Windows\Fonts\simhei.ttf"
    FONT_R = FONT_B

W, H = 1080, 1580

def font(size, bold=True):
    return ImageFont.truetype(FONT_B if bold else FONT_R, size)

# ---------- 背景：深紫黑 + 四角霓虹光斑（numpy 向量化） ----------
yy, xx = np.mgrid[0:H, 0:W]
# 基础线性渐变
t = yy / H
r = BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t
g = BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t
b = BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t
bg = np.stack([r, g, b], axis=2)

def add_glow(bg, cx, cy, color, radius, strength):
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    halo = np.exp(-(dist / radius) ** 2) * strength
    for k in range(3):
        bg[:, :, k] = np.clip(bg[:, :, k] + halo * color[k], 0, 255)

add_glow(bg, W * 0.94, H * 0.06, PINK, 520, 0.85)
add_glow(bg, W * 0.05, H * 0.35, CYAN, 470, 0.55)
add_glow(bg, W * 0.96, H * 0.78, VIOLET, 500, 0.6)
add_glow(bg, W * 0.22, H * 0.96, LEMON, 460, 0.42)
bg = bg.astype(np.uint8)
img = Image.fromarray(bg, 'RGB')
d = ImageDraw.Draw(img)

# ---------- 顶部标题 ----------
f_title = font(92)
f_sub = font(34, bold=False)
title = "Perler Studio"
tw = d.textlength(title, font=f_title)
d.text((int((W - tw) / 2), 70), title, font=f_title, fill=WHITE)
# 渐变装饰线
for i in range(W // 2 - 360, W // 2 + 360):
    frac = (i - (W // 2 - 360)) / 720
    col = tuple(int(PINK[k] * (1 - frac) + VIOLET[k] * frac) for k in range(3))
    d.line([(i, 196), (i, 204)], fill=col, width=2)
sub = "拼豆图纸生成器 · 图片 / AI 一键出图纸"
sw = d.textlength(sub, font=f_sub)
d.text((int((W - sw) / 2), 218), sub, font=f_sub, fill=MUTED)

# ---------- 二维码（标准黑白保证可扫 + 霓虹外描边） ----------
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=0)
qr.add_data(URL)
qr.make(fit=True)
mat = qr.get_matrix()
N = len(mat)
QRCODE_SIZE = 780
MOD = QRCODE_SIZE // N
QR_PX = QRCODE_SIZE
QX = (W - QR_PX) // 2
QY = 300
# 白底圆角（含 quiet zone）
d.rounded_rectangle([QX - 18, QY - 18, QX + QR_PX + 18, QY + QR_PX + 18], radius=38, fill=WHITE)
# 标准黑模块（方形，保证 100% 可扫）
mod_col = (18, 18, 28)
for y in range(N):
    for x in range(N):
        if mat[y][x]:
            px = QX + MOD * x
            py = QY + MOD * y
            d.rectangle([px, py, px + MOD, py + MOD], fill=mod_col)
# 霓虹描边 + 外发光（高级感，不干扰扫码）
d.rounded_rectangle([QX - 20, QY - 20, QX + QR_PX + 20, QY + QR_PX + 20], radius=40, outline=(184, 123, 255), width=5)
d.rounded_rectangle([QX - 26, QY - 26, QX + QR_PX + 26, QY + QR_PX + 26], radius=44, outline=(255, 77, 166), width=3)

# ---------- 扫一扫提示 ----------
f_hint = font(40)
hint = "微信扫一扫 · 立即开始拼豆"
hw = d.textlength(hint, font=f_hint)
d.text((int((W - hw) / 2), QY + QR_PX + 40), hint, font=f_hint, fill=WHITE)

# ---------- 底部：链接 + 署名 ----------
f_url = font(30)
url = URL.replace("https://", "")
uw = d.textlength(url, font=f_url)
y_url = H - 250
d.text((int((W - uw) / 2), y_url), url, font=f_url, fill=MUTED)
f_by = font(30)
by = "开发者：涛涛 · 为拼豆爱好者制作"
bw = d.textlength(by, font=f_by)
d.text((int((W - bw) / 2), y_url + 74), by, font=f_by, fill=TEXT)
# 底部像素豆
beads = [PINK, CYAN, LEMON, VIOLET, PINK]
for i, c in enumerate(beads):
    px = W // 2 - len(beads) * 18 + i * 36
    d.rounded_rectangle([px, H - 78, px + 26, H - 52], radius=8, fill=c)

out = os.path.join(OUT_DIR, "share-poster-v3.png")
img.save(out, "PNG")
print("海报已生成:", out, img.size)
