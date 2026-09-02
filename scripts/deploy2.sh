#!/usr/bin/env bash
# ============================================================
# deploy2.sh — 重建 gh-pages 分支（dist 内容放根目录）
# 用独立临时 git 仓库，完全不碰工作区
# ============================================================
set -e
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "① 构建最新产物..."
npm run build >/dev/null 2>&1

TMP="$(mktemp -d)"
echo "② 打包 dist 内容 → $TMP"
cp -r dist/* "$TMP/"

cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="taotao-0817" -c user.email="taotao-0817@users.noreply.github.com" \
  commit -q -m "deploy: Perler Studio (gh-pages)"

echo "③ 强制推送 gh-pages 分支..."
git push -f "https://github.com/taotao-0817/perler-studio.git" HEAD:gh-pages

echo "DEPLOY_OK ✅ gh-pages 根目录已包含站点文件"
