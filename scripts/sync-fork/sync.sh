#!/usr/bin/env bash
#
# sync.sh — 一鍵把 j7 fork 重生到 build 分支 = 全新 upstream + j7 客製。
#
# 模型:
#   j7/custom  = recipe + owned 檔的「來源分支」(你維護的地方)
#   build      = 每次重生的「產出分支」(可丟棄，發佈用)
#
# 用法 (在 repo 任意處，工作目錄要乾淨):
#   bash scripts/sync-fork/sync.sh
#
# 環境變數:
#   UPSTREAM    = 上游 ref，預設 origin/master
#   RECIPE_REF  = recipe/owned 來源分支，預設 j7/custom
#   INCLUDE_DEMO= 1(預設) 帶 demo 客製 / 0 純 library
#
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
UPSTREAM="${UPSTREAM:-origin/master}"
RECIPE_REF="${RECIPE_REF:-j7/custom}"
REMOTE="${UPSTREAM%%/*}"

# 只擋「已追蹤」變更 (未追蹤如 .serena / scratchpad / build 產物不會被 checkout 清掉, 不擋)
DIRTY="$(git status --porcelain --untracked-files=no)"
if [ -n "$DIRTY" ]; then
  echo "!! 有未提交的『已追蹤』變更，先 commit / stash 再跑:"
  echo "$DIRTY"
  exit 1
fi

echo "==> fetch $REMOTE"
git fetch "$REMOTE"

echo "==> 重建 build 分支 = 全新 $UPSTREAM"
git checkout -B build "$UPSTREAM"

echo "==> 注入 recipe (從 $RECIPE_REF)"
git checkout "$RECIPE_REF" -- scripts/sync-fork
# 保險: build 分支可能無 .gitattributes，去除 CRLF 以免 bash 炸
sed -i 's/\r$//' scripts/sync-fork/*.sh scripts/sync-fork/*.mjs 2>/dev/null || true

echo "==> 套用 j7 客製"
RECIPE_REF="$RECIPE_REF" INCLUDE_DEMO="${INCLUDE_DEMO:-1}" bash scripts/sync-fork/apply-j7.sh

cat <<EOF

================================================================
完成。build 分支 = 全新 upstream + j7 客製 (改名/deps/Page/排版)。

驗證 + 發佈:
  pnpm install
  pnpm build
  # 測試 OK 後:
  git add -A && git commit -m "build: j7 fork @ \$(git rev-parse --short $UPSTREAM)"
  # 發佈 npm (依你原本 lerna/pnpm 流程)

衝突/失敗時看上面各步驟的 ! 警告，或讀 scripts/sync-fork/README.md。
================================================================
EOF
