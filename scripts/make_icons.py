# -*- coding: utf-8 -*-
"""生成拼豆风 PWA 图标：克莱因蓝底 + 像素爱心 + 彩色拼豆点缀"""
from PIL import Image, ImageDraw
import os

OUT = r"C:\auto work\perler-studio\public\icons"
os.makedirs(OUT, exist_ok=True)

BLUE = (0, 47, 167)      # 克莱因蓝
WHITE = (255, 255, 255)
RED = (226, 58, 46)
YELLOW = (253, 210, 28)
GREEN = (65, 168, 80)
PINK = (255, 123, 172)

# 8x8 像素爱心（1=主体白/彩, 0=背景蓝），外围加一圈蓝边留安全区
HEART = [
    ".X..X.",
    "XXXXXX",
    "XXXXXX",
    ".XXXX.",
    "..XX..",
    "...X..",
]

# 点缀彩豆位置（行,列,颜色）
DOTS = [
    (1, 0, RED), (1, 5, YELLOW), (2, 1, GREEN), (2, 4, PINK),
    (3, 2, YELLOW), (4, 2, RED), (4, 3, GREEN), (1, 2, PINK), (1, 3, RED),
]

GRID = 8  # 爱心画布 6x6 放在 8x8 网格中间
CELL = 64  # 512/8


def make_icon(size, maskable=False):
    cell = size // GRID
    img = Image.new("RGBA", (size, size), BLUE)
    d = ImageDraw.Draw(img)

    ox = (GRID - len(HEART[0])) // 2
    oy = (GRID - len(HEART)) // 2

    for y, row in enumerate(HEART):
        for x, ch in enumerate(row):
            if ch == "X":
                px = (x + ox) * cell
                py = (y + oy) * cell
                d.rounded_rectangle([px, py, px + cell, py + cell], radius=cell * 0.22, fill=WHITE)

    # 彩色拼豆点缀
    for (y, x, col) in DOTS:
        px = (x + ox) * cell
        py = (y + oy) * cell
        d.rounded_rectangle([px, py, px + cell, py + cell], radius=cell * 0.22, fill=col)

    # 爱心外圈像素描边（蚀刻风）
    d.rounded_rectangle([cell * 0.5, cell * 0.5, size - cell * 0.5, size - cell * 0.5],
                        radius=size * 0.14, outline=(255, 255, 255, 70), width=max(2, size // 170))
    return img


make_icon(512).save(os.path.join(OUT, "icon-512.png"))
make_icon(192).save(os.path.join(OUT, "icon-192.png"))
make_icon(512).save(os.path.join(OUT, "maskable-512.png"))
make_icon(180).save(os.path.join(OUT, "apple-touch-icon.png"))
print("icons done:", os.listdir(OUT))
