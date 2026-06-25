# sync-fork — j7 fork 「配方化」維護

把 j7 對 `easy-email` 的客製存成**可重跑的配方**，而非永久 fork diff。
同步 upstream 不再 merge、不再解衝突 —— 跑一個腳本，從最新 master 重生即可。

## 鐵則：永不 merge

**禁止 `git merge master` 進 j7/custom。** 那會讓改名 diff 跟 upstream 每檔對撞 = 衝突地獄。
upstream 更新一律靠 `sync.sh` 從最新 master **重生**，不是 merge。

## 三個分支的角色

```
master (origin/master)  上游鏡像，唯讀。sync.sh 只「讀」它，從不改它。
j7/custom               recipe + owned 檔 (types.d.ts / demo) 的來源。你維護的地方。
build                   sync.sh 每次「重置重生」的成品 = 最新 master + 客製。發佈用，拋棄式。
```

> `build` 每次 `sync.sh` 都被 `git checkout -B build origin/master` 重置 —— 它是產出，不是你維護的分支。發佈完即可被下次重生覆蓋。

## 完整流程

### 前置（一次性，已完成）
recipe 已 commit 在 j7/custom。

### 每次同步（第一次 = 未來每次，完全一樣）

```bash
# 1. 切到 recipe 分支，工作目錄要乾淨
git checkout j7/custom
git status                       # 不乾淨先 commit / stash

# 2. 一鍵重生 (跑完你會在 build 分支)
bash scripts/sync-fork/sync.sh

# 3. 驗證
pnpm install && pnpm build

# 4. 測 OK → commit 到 build
git add -A && git commit -m "build: j7 fork @ $(git rev-parse --short origin/master)"

# 5. 發佈 (你原本的 lerna / pnpm publish 流程)
```

`sync.sh` 內部自動：`git fetch origin` → `git checkout -B build origin/master`
→ 注入 recipe → `apply-j7.sh`（改名 / deps / Page / owned 還原 / prettier）。

想先看 upstream 這次改了啥（不 merge 也能看）：
```bash
git fetch origin && git log --oneline j7/custom..origin/master
```

環境變數：`UPSTREAM`（預設 `origin/master`）、`RECIPE_REF`（預設 `j7/custom`）、`INCLUDE_DEMO`（`1`/`0`）。
或在 Claude Code 裡輸入 `/sync-fork`（跑 sync.sh，失敗時協助修補）。

## 為什麼這樣做

`j7/custom` 相對 upstream 的 diff 有 ~22k 行，但用 prettier 正規化 + 排除改名後驗證，
**真客製極小**。其餘 99% 是兩種「可機械重生」的雜訊，存進 git 才害每次同步衝突：

| 類別 | 內容 | 重生方式 | 性質 |
|---|---|---|---|
| 改名 | `easy-email-{core,editor,extensions,localization}` → `j7-*`（窄：import / package name / alias key） | codemod | 機械，防彈 |
| 排版 | 全庫 prettier（`singleAttributePerLine` 等，upstream 已刪 `.prettierrc`） | `prettier --write` | 機械 |
| **真邏輯①** | `Page` 預設 `hideSubTitle=true, hideSubject=true` | perl 精準改 | **保存** |
| **真邏輯②** | `types.d.ts`（scss module 宣告，配合 sass deps） | owned 檔還原 | **保存** |
| devDeps | core/editor/extensions 加 sass·postcss 工具鏈 | `add-deps.mjs` | **保存** |
| demo | custom block 範例等（個人 playground） | owned 檔還原（選配） | 選配 |

改名是「窄」的，刻意**保留**：CSS class 字串（`'easy-email-editor-tabWrapper'`）、
檔案路徑值（`'../easy-email-core'`）、DOM 根 ID（`EASY_EMAIL_EDITOR_ID = 'easy-email-editor'`）。

> 已知**捨棄**的雜訊（runtime 完全相同，故意不保存）：`useBlock.ts` / `getContextMergeTags.ts`
> 移除多餘 `as` cast、`tableTool.ts` 樣板字串轉字串、`MergeTagBadgePrompt` 多餘跳脫、
> `RichTextField/index.tsx` 的 TODO 註解。要留請自行加回。

> owned 檔不抄進 recipe，而是重生時用 `git checkout j7/custom -- <path>` 取回 ——
> 所以你改 owned 檔（demo 等）只要改在 j7/custom，下次重生自動帶入。
> 新增「真邏輯」客製：在 j7/custom 編 `apply-j7.sh` 加一行 perl。

## 失敗排查

| 症狀 | 原因 | 處置 |
|---|---|---|
| `Page 編輯沒 match` 警告 | upstream 改了 `Page()` 結構 | 讀新版手動套 `= true`，並更新 apply-j7.sh 的 perl |
| owned 還原失敗 | upstream 把 demo 檔搬位 | 更新 apply-j7.sh 的 demo 路徑清單 |
| build 報找不到 `easy-email-xxx` | upstream 新增第 5 個套件 | 把新套件名加進 apply-j7.sh 改名 alternation |
| prettier 失敗 | 離線 | 忽略，不影響功能/發佈 |

## 檔案

- `sync.sh` — 一鍵編排（fetch → 建 build → 注入 recipe → apply）
- `apply-j7.sh` — 純轉換（改名 / deps / Page / owned / prettier）
- `add-deps.mjs` — devDeps 注入器
- `prettierrc.json` — `.prettierrc` 備份（upstream 已刪，重生需要）
