#!/usr/bin/env bash
# 本地一键部署（Direct Upload 路线，不依赖 Cloudflare 的 Git 集成）
# 用法：./deploy.sh [项目名] [分支]
set -euo pipefail
cd "$(dirname "$0")"

PROJECT="${1:-claude-opus-5-5-games}"
BRANCH="${2:-main}"

echo "==> 构建三个游戏到 public/"
npm run build

echo "==> 上传到 Cloudflare Pages: ${PROJECT} (${BRANCH})"
wrangler pages deploy public --project-name="$PROJECT" --branch="$BRANCH"

echo "==> 完成。默认域名 https://${PROJECT}.pages.dev"
