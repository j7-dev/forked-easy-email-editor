# CLAUDE.md

本專案是 `easy-email` 的 fork，發佈為 `j7-easy-email-*` 套件。

## Fork 維護鐵則（最重要）

**禁止把 upstream merge 進 `j7/custom`。** 不要建議、不要執行 `git merge master`（或 rebase）。
fork 客製用「配方重生」維護，不用 git 合併 —— merge 會讓改名 diff 跟 upstream 每檔對撞 = 衝突地獄。

### 分支角色

- `master` / `origin/master`：上游鏡像，**唯讀**。只讀不改。
- `j7/custom`：recipe（`scripts/sync-fork/`）+ owned 檔（`packages/.../types.d.ts`、`demo/`）的來源。維護處。
- `build`：`sync.sh` 每次 `git checkout -B build origin/master` **重置重生**的成品 = 最新 master + 客製。發佈用，拋棄式。

### upstream 更新時的唯一正確做法

```bash
git checkout j7/custom          # 工作目錄要乾淨
bash scripts/sync-fork/sync.sh  # 從最新 origin/master 重生到 build 分支
pnpm install && pnpm build      # 驗證
git add -A && git commit -m "build: j7 fork @ <sha>"   # commit 到 build
# 再走原本 publish 流程
```

新 diff 透過 `checkout -B build origin/master` 自動進來，**不需 merge**。
細節、客製拆解、失敗排查見 `scripts/sync-fork/README.md`。也可用 `/sync-fork` 命令。

### 改客製

- demo / owned 檔：直接改 `j7/custom` 上的該檔（重生時自動帶入）。
- 新增「真邏輯」客製：在 `j7/custom` 編 `scripts/sync-fork/apply-j7.sh` 加 perl，**不要**直接改 build 產出。
