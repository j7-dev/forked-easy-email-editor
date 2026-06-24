---
description: 從 upstream 重生 j7 fork (改名+deps+Page+prettier)，失敗時協助修補
---

執行 `bash scripts/sync-fork/sync.sh`，把 j7 客製重生到 `build` 分支。

完整模型與拆解見 `scripts/sync-fork/README.md`。執行重點：

1. 跑 `bash scripts/sync-fork/sync.sh`，逐步回報每個 `==>` 步驟結果。
2. 若出現 `!` 或 `!!` 警告，依下表處置後回報，**不要靜默跳過**：
   - **`Page 編輯沒 match`** → upstream 改了 `Page()` 結構。讀
     `packages/easy-email-extensions/src/AttributePanel/components/blocks/Page/index.tsx`
     新版，手動把 `Page()` 參數預設改成 `hideSubTitle = true, hideSubject = true`，
     並更新 `apply-j7.sh` 的 perl 使其對得上新結構。
   - **owned 檔還原失敗** → upstream 把 demo 檔搬位。比對新路徑，更新 `apply-j7.sh` demo 清單。
   - **build 報找不到 `easy-email-xxx`** → upstream 新增第 5 個 `easy-email-*` 套件。
     把新套件名加進 `apply-j7.sh` 改名 alternation `(core|editor|extensions|localization)`。
   - **prettier 失敗（離線）** → 忽略，不影響功能。
3. 成功後提示使用者跑 `pnpm install && pnpm build` 驗證，再 commit / 發佈。

注意：sync.sh 會 `git checkout -B build` 並要求工作目錄乾淨；若不乾淨先請使用者 commit/stash。
