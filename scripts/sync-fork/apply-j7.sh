#!/usr/bin/env bash
#
# apply-j7.sh — 把 j7 fork 的客製套到「已是全新 upstream」的工作目錄上。
#
# 前提:
#   - CWD 在 repo 內，工作目錄 = 全新 upstream (由 sync.sh checkout 到 build 分支)
#   - recipe 已存在於 scripts/sync-fork/ (由 sync.sh 從 RECIPE_REF 注入)
#   - RECIPE_REF = 持有 owned 檔 (types.d.ts / demo) 的分支，預設 j7/custom
#
# 客製拆解 (來源: prettier 正規化驗證，詳見 README.md):
#   1. .prettierrc       — upstream 已刪，recipe 補回 (排版重生依據)
#   2. owned 檔還原       — types.d.ts (+ demo, 選配) 從 RECIPE_REF 取回
#   3. devDeps 注入       — sass / postcss 工具鏈
#   4. 真邏輯編輯         — Page 預設隱藏主旨 / 副標
#   5. 改名 codemod       — easy-email-* -> j7-easy-email-*
#   6. prettier 重排版    — 用 .prettierrc 重生 j7 排版
#
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
RECIPE_REF="${RECIPE_REF:-j7/custom}"
RECIPE_DIR="scripts/sync-fork"
INCLUDE_DEMO="${INCLUDE_DEMO:-1}"

echo "==> [1/6] 確保 .prettierrc 存在 + .gitignore 忽略工具目錄"
if [ ! -f .prettierrc ]; then
  cp "$RECIPE_DIR/prettierrc.json" .prettierrc
  echo "    補回 .prettierrc (upstream 已刪)"
fi
# build 分支(=upstream).gitignore 沒有 .serena, 避免 step 4 git add -A 撈進來
grep -qxF '.serena/' .gitignore 2>/dev/null || echo '.serena/' >> .gitignore

echo "==> [2/6] 還原 owned 檔 (從 $RECIPE_REF)"
# 真邏輯②: 新檔 types.d.ts (scss module 宣告)
git checkout "$RECIPE_REF" -- packages/easy-email-extensions/src/types.d.ts
echo "    + types.d.ts"
if [ "$INCLUDE_DEMO" = "1" ]; then
  # demo = 個人 playground，整批取 j7 版 (取代 upstream demo)。
  # 不發佈，不影響 library；要 upstream demo 改進就設 INCLUDE_DEMO=0。
  git checkout "$RECIPE_REF" -- \
    demo/src/components/CustomBlocks \
    demo/src/components/AutoSaveAndRestoreEmail.tsx \
    demo/src/pages/Editor/components \
    demo/src/pages/Editor/testMergeTags.ts \
    demo/src/pages/Editor/index.tsx \
    demo/src/store/extraBlocks.ts \
    demo/src/store/template.ts \
    demo/src/utils/emailToImage.ts \
    demo/tsconfig.json \
    demo/vite.config.ts 2>/dev/null && echo "    + demo (custom blocks 等)" \
    || echo "    ! demo 還原部分失敗 (路徑在 upstream 變了?)，略過"
fi

echo "==> [3/6] 注入 build devDependencies"
node "$RECIPE_DIR/add-deps.mjs"

echo "==> [4/6] 真邏輯: Page 預設隱藏主旨/副標"
PAGE="packages/easy-email-extensions/src/AttributePanel/components/blocks/Page/index.tsx"
perl -0pi -e 's/function Page\(\{\s*hideSubTitle\s*,\s*hideSubject\s*\}\s*:\s*PageProps\)/function Page({ hideSubTitle = true, hideSubject = true }: PageProps)/' "$PAGE"
if grep -q 'hideSubject = true' "$PAGE"; then
  echo "    OK Page 預設已套用"
else
  echo "    !! 警告: Page 編輯沒 match — upstream 改了 Page 結構。"
  echo "       手動把 $PAGE 的 Page() 參數預設改成 hideSubTitle = true, hideSubject = true"
fi

echo "==> [5/6] 改名 codemod easy-email-* -> j7-easy-email-*"
# j7 的改名是「窄」的: 只改 module specifier 與 package.json name/deps key,
# 即「被引號夾住、後面接引號或 /」的 token。
# 不動: CSS class 字串 ('easy-email-editor-tabWrapper')、檔案路徑值 ('../easy-email-core')。
# \x27=' \x22=" 用 hex 避開 bash 引號; (?<=[\x27\x22]) 同時保證冪等(已是 j7- 的前面是 '-' 不 match)。
mapfile -t FILES < <(git ls-files packages demo | grep -E '\.(ts|tsx|js|jsx|json)$' || true)
# extensions? 同時涵蓋 package 名(複數)與 vite UMD name 'easy-email-extension'(單數)
printf '%s\0' "${FILES[@]}" | xargs -0 perl -pi -e \
  's{(?<=[\x27\x22])easy-email-(core|editor|extensions?|localization)(?=[\x27\x22/])}{j7-easy-email-$1}g'
echo "    改名掃描 ${#FILES[@]} 檔"

# 改名特例: 編輯器 DOM 根 ID 維持 'easy-email-editor' (CSS/DOM querySelector 依賴它, j7 刻意未改)
perl -pi -e 's{(EASY_EMAIL_EDITOR_ID\s*=\s*[\x27\x22])j7-}{$1}' \
  packages/easy-email-editor/src/constants.ts 2>/dev/null || true

echo "==> [6/6] prettier 重排版"
if npx --yes prettier@3 --config .prettierrc --write \
     'packages/**/*.{ts,tsx,json}' 'demo/**/*.{ts,tsx,json}' --log-level warn; then
  echo "    OK 排版重生"
else
  echo "    ! prettier 失敗 (離線?)。排版略過，不影響功能/發佈。"
fi

echo
echo "==> apply-j7 完成。下一步:"
echo "    pnpm install && pnpm build"
