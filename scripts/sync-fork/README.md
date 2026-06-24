# sync-fork — j7 fork 「配方化」維護

把 j7 對 `easy-email` 的客製存成**可重跑的配方**，而非永久 fork diff。
未來同步 upstream 不再解 38-commit merge 地獄 —— 跑一個腳本重生即可。

## 為什麼這樣做

`j7/custom` 相對 upstream 的 diff 有 ~22k 行，但用 prettier 正規化 + 排除改名後驗證，
**真正的客製其實極小**。其餘 99% 是兩種「可機械重生」的雜訊，存進 git 才害每次 sync 都衝突：

| 類別 | 內容 | 重生方式 | 性質 |
|---|---|---|---|
| 改名 | `easy-email-{core,editor,extensions,localization}` → `j7-*`（name + deps + 所有 import） | sed/perl codemod | 機械，防彈 |
| 排版 | 全庫 prettier（`singleAttributePerLine` 等，upstream 已刪 `.prettierrc`） | `prettier --write` | 機械 |
| **真邏輯①** | `Page` 預設 `hideSubTitle=true, hideSubject=true` | perl 精準改 | **要保存** |
| **真邏輯②** | `types.d.ts`（scss module 宣告，配合 sass deps） | owned 檔還原 | **要保存** |
| devDeps | core/editor/extensions 加 sass·postcss 工具鏈 | `add-deps.mjs` | **要保存** |
| demo | custom block 範例等（個人 playground） | owned 檔還原（選配） | 選配 |

> 已知**捨棄**的雜訊（runtime 完全相同，故意不保存）：
> `useBlock.ts` / `getContextMergeTags.ts` 移除多餘 `as` cast、`tableTool.ts` 樣板字串轉字串、
> `MergeTagBadgePrompt` 多餘跳脫清理。
> 另 `RichTextField/index.tsx` 有個「toolbar 有 bug 應隱藏」的 TODO 註解（無行為），重生會丟失 —— 要留請自行加回。

## 模型

```
j7/custom   你維護的「來源分支」：recipe (scripts/sync-fork/) + owned 檔 (types.d.ts, demo)
build       每次重生的「產出分支」：全新 upstream + 套上客製，發佈用，可丟可重建
```

owned 檔不抄進 recipe，而是在重生時用 `git checkout j7/custom -- <path>` 取回 ——
所以你改 owned 檔只要改在 `j7/custom`，下次重生自動帶入。

## 用法

```bash
# 0. 一次性：把 recipe commit 到 j7/custom (sync.sh 靠 checkout 它)
git add scripts/sync-fork .claude/commands/sync-fork.md && git commit -m "build: add sync-fork recipe"

# 每次同步 upstream：
bash scripts/sync-fork/sync.sh        # 重生到 build 分支
pnpm install && pnpm build            # 驗證
git -C . checkout build && git add -A && git commit -m "build: j7 fork @ <upstream-sha>"
# 發佈走你原本 lerna/pnpm 流程
```

或在 Claude Code 裡輸入 `/sync-fork`（會跑 sync.sh，失敗時協助修補）。

環境變數：`UPSTREAM`（預設 `origin/master`）、`RECIPE_REF`（預設 `j7/custom`）、`INCLUDE_DEMO`（`1`/`0`）。

## 失敗排查

| 症狀 | 原因 | 處置 |
|---|---|---|
| `Page 編輯沒 match` 警告 | upstream 改了 `Page()` 結構 | 讀新版手動把參數預設改 `= true`，並更新 apply-j7.sh 的 perl |
| owned 還原失敗 | upstream 把 demo 檔搬位 | 更新 apply-j7.sh 的 demo 路徑清單 |
| build 報找不到 `easy-email-xxx` | upstream 新增第 5 個套件 | 把新套件名加進 apply-j7.sh 改名 alternation `(core\|editor\|...)` |
| prettier 失敗 | 離線 | 忽略，不影響功能/發佈 |

## 檔案

- `sync.sh` — 一鍵編排（fetch → 建 build → 注入 recipe → apply）
- `apply-j7.sh` — 純轉換（改名 / deps / Page / owned / prettier）
- `add-deps.mjs` — devDeps 注入器
- `prettierrc.json` — `.prettierrc` 備份（upstream 已刪，重生需要）
