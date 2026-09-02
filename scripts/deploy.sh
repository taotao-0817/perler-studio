#!/usr/bin/env bash
# ============================================================
# deploy.sh — 构建并部署到 GitHub Pages (gh-pages 分支)
# 非破坏性：不删除任何工作区文件
# ============================================================
set -e
cd "$(dirname "$0")/.."

echo "① 构建最新产物..."
npm run build >/dev/null 2>&1

echo "② 准备 gh-pages 分支..."
if git branch --list gh-pages | grep -q gh-pages; then
  git branch -D gh-pages
fi
git checkout --orphan gh-pages

echo "③ 提交 dist 内容..."
git add -f dist
git -c user.name="taotao-0817" -c user.email="taotao-0817@users.noreply.github.com" \
  commit -q -m "deploy: Perler Studio (gh-pages)"

echo "④ 推送到 GitHub..."
git push origin gh-pages --force

echo "⑤ 切回 master..."
git checkout master

echo "DEPLOY_OK ✅ gh-pages 已更新"
