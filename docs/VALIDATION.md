# 實際驗證紀錄

驗證日期：2026-11-02（Asia/Taipei）。本文件記錄本機隔離環境結果，不代表雲端或真實 Supabase 已驗收。

## 結果

| 項目                | 結果     | 實際範圍                                                                                                                                                   |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 專案架構與分支      | 已檢查   | Next App Router、Prisma generator/migrations、Supabase SSR、GitHub 分支                                                                                    |
| TypeScript          | 通過     | `npm run typecheck`                                                                                                                                        |
| Production Build    | 通過     | `npm run build`，含 middleware 與 4 個頁面／API 功能類別                                                                                                   |
| 規則與權限單元測試  | 7 通過   | 分批出貨、預留／可用計算、超賣／超出貨拒絕、冪等入庫、SKU 隔離、預設拒絕、workspace 身分、錯誤模式拒絕                                                     |
| PostgreSQL 整合測試 | 1 通過   | 本機 Docker PostgreSQL 16、Prisma JS adapter、交易鎖、併發預留、重複請求、分批出貨、A/B 資料隔離、RLS、anon 無 SELECT 權限                                 |
| 瀏覽器／API E2E     | 6 通過   | Chromium：完整 SKU→入庫→預留→部分出貨→Dashboard→刷新；Origin／數量拒絕；兩個瀏覽器隔離；本機模擬 Auth 的未登入／未核准拒絕、壞登入格式、A/B API 隔離與登出 |
| Git 敏感資訊掃描    | 通過     | Gitleaks 8.24.3，全提交歷史及本輪 staged diff，輸出已遮蔽；未掃出符合規則的秘密                                                                            |
| 真實 Supabase 登入  | 未執行   | 等待使用者測試專案授權及安全設定                                                                                                                           |
| 雲端 migrations     | 未執行   | 本機直接執行 migration SQL 已通過；Prisma CLI 原生引擎網域被現行 egress policy 擋住，未宣稱 `migrate deploy` 成功                                          |
| GitHub Actions CI   | 待執行   | 工作流已準備，尚未讀到 GitHub 執行結果                                                                                                                     |
| Vercel Preview      | 尚未建立 | 使用者尚無 Vercel 帳號；設定與操作指引已完成                                                                                                               |
| Pull Request        | 建立受阻 | Git 推送正常；GraphQL／REST API 均被 CONNECT 403 擋住，環境設定已增加 api.github.com 草稿但未套用至執行期                                                  |

單元／資料庫完整指令：在本機隔離 `kcrown_demo` 下設定 `APP_MODE=production RUN_DB_TESTS=1 DATABASE_URL` 後執行 `npm test`：**8 passed、0 failed、0 skipped**。一般 `npm test` 未指定 DB 時會明確 skip 資料庫測試。

E2E：啟動 Demo server，安全注入同一個本機測試 DATABASE_URL 後執行 `npm run test:e2e`：**6 passed、0 failed、0 skipped**。本機 Supabase 協定模擬器不會連到外部；它不驗證真實 Supabase 的帳號密碼、Token 簽章或服務設定。

## 修正的問題

- 原本的 `.demo/inventory.json` 本機寫檔改為每瀏覽器 localStorage，避免 Vercel read-only filesystem 與跨使用者 Demo 洩漏。
- 正式資料從共用 `main` 改為已驗證 user UUID 對應的私人工作區，body 中偽造 userId/workspaceId 不改變擁有者。
- Supabase 登入以核准 UUID 名單限制進入；空白名單全部拒絕。
- 新增 RLS 與撤銷 Data API 角色直接讀寫，補上登出及錯誤 APP_MODE 拒絕啟動。
- 新增明確產品列表、Demo 重設、Vercel Build 設定、CI 與操作指引。

## 敏感資訊範圍

掃描未發現實際密碼、私鑰、API Token 或含密碼的資料庫 URI。`.env.example` 僅有空白欄位及非機密模式；CI 無密碼的 localhost URI 及測試程式的 local-test 字串都是隔離測試用途，非雲端憑證。`.env*` 被 Git 忽略，只有 `.env.example` 刻意追蹤。不可把零偵測視為完整安全保證，也未稽核 GitHub 外部服務儲存的 Secrets。

## 未完成的正式上線驗收

真實 Supabase Email 登入／Session 更新／兩帳號隔離及 Data API；Vercel Preview URL 與 deployment protection；Migration CLI 與備份；正式業務規則確認。現階段為私人工作區，不提供公司團隊共享或角色分權。不得自動搬移舊 `main` aggregate、匯入正式資料或合併／正式部署。
