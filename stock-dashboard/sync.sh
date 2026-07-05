#!/bin/bash
# 一鍵同步到 GitHub
# 用法: ./sync.sh
# 需求: 已在 ~/Desktop/knowledge-hub 有 git clone

REPO_DIR="$HOME/Desktop/knowledge-hub"
DASH_DIR="$(dirname "$0")"

echo "📤 同步 Stock Dashboard 到 GitHub..."

# 複製最新檔案到 knowledge-hub repo
cp "$DASH_DIR/watchlist.json" "$REPO_DIR/stock-dashboard/watchlist.json"
cp "$DASH_DIR/data.json"      "$REPO_DIR/stock-dashboard/data.json" 2>/dev/null || true
cp "$DASH_DIR/fetch.py"       "$REPO_DIR/stock-dashboard/fetch.py"
cp "$DASH_DIR/index.html"     "$REPO_DIR/stock-dashboard/index.html"

# Git push
cd "$REPO_DIR"
git add stock-dashboard/
git commit -m "Update stock dashboard - $(date '+%Y-%m-%d %H:%M')"
git push

echo "✅ 同步完成！GitHub Pages 約 1 分鐘後更新"
echo "   https://deanlee-76.github.io/knowledge-hub/stock-dashboard/"
