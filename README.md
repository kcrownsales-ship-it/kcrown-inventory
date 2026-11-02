# K-Crown Inventory

Airsoft 商品進銷存 MVP：Next.js 15、TypeScript、Prisma 6.19／PostgreSQL、Supabase Auth。

## 立即試用本機 Demo

Node.js 22.12+（建議 22.x）、npm；不需要資料庫或任何 Key。

```sh
npm ci
npm run db:generate
npm run build
APP_MODE=demo npm start
```

Demo 含 PDF 參考的 13 型號，GLOCK 按材質拆為 15 規格、共 30 示範 SKU。黑色／沙色為待確認的示範顏色；初始 100 件皆為虛構。操作保存在各瀏覽器 localStorage，與正式 PostgreSQL 完全隔離。可重設 Demo，禁止輸入真實資料。

功能：商品列表與獨立 SKU、庫存 Dashboard、採購入庫、訂單建立及預留、分批出貨自動扣庫、異動紀錄。可用 = 現有 − 預留；未交 = 訂購 − 已出貨。每筆訂單一個 SKU。尚未包含取消／退貨、多倉、團隊共享、角色分級與會計功能。

## 架構

- `app/workspace.tsx`：產品、Dashboard 與操作介面；Demo 使用瀏覽器儲存。
- `lib/inventory.ts`：共用庫存運算與不變量。
- `app/api/operations`：登入、核准名單、同源與輸入驗證後執行正式資料異動。
- `lib/auth.ts`、`middleware.ts`：Supabase SSR 驗證與 Cookie 更新。
- `lib/access.ts`：預設拒絕權限、伺服器身分 workspace key。
- `lib/store.ts`：每位使用者的獨立 aggregate、PostgreSQL 交易鎖與冪等性。
- `prisma/migrations`：JSONB 庫存資料表、RLS 與 Data API 權限限制。
- `vercel.json`：明確的 Generate／Build 設定，Build 不執行 migrations。

## 驗證

```sh
npm test
npm run typecheck
npm run build
# 先啟動 Demo，需系統 Chromium（CHROMIUM_PATH 可指定）
npm run test:e2e
# 只有 local kcrown_demo 資料庫可執行；先套用 migrations 與建立測試 anon role
# 在安全 shell 注入 DATABASE_URL 後執行，不可指向雲端正式庫
npm run test:db
```

Prisma Client 用固定套件版本的官方 generator／WASM parser 產生，未停用套件、checksum 或 TLS 驗證。Migration CLI 需要 `binaries.prisma.sh` 網路存取。資料庫測試只清理固定測試使用者的工作區。

[測試部署與 Supabase 人工設定](docs/DEPLOYMENT.md) · [實際驗證結果](docs/VALIDATION.md)

雲端授權、正式資料寫入、合併 main 與正式部署均需使用者另行確認。真實 Supabase 登入與雲端 Preview 尚待人工完成設定及驗收。
