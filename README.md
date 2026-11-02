# K-Crown Inventory

Airsoft 商品進銷存 MVP。Next.js 15 / TypeScript / PostgreSQL / Prisma 6.19（JavaScript PostgreSQL adapter） / Supabase Auth。

## 本機示範

需要 Node.js 22.12+（本環境使用 24）、npm。

```sh
npm ci
npm run db:generate
npm test
npm run build
npm run dev
```

預設 `APP_MODE=demo`，不需帳號或資料庫。資料保存在忽略版控的 `.demo/inventory.json`；僅供單程序本機示範，不能對外部署。刪除此檔會重設示範資料。不要把正式資料放入示範環境。

## 功能與資料來源

- Dashboard 依 SKU 顯示型號、材質、版型、顏色、現有、預留、出貨、未交與可用庫存。
- 建立獨立 SKU、採購入庫、客戶訂單自動預留、分批出貨扣庫、異動紀錄。
- 可用 = 現有 − 預留；未交 = 訂購 − 已出貨。庫存不足時拒絕訂單，不產生負庫存。
- PDF `Airsoft_Magazine_Catalogue.pdf` 為商品參考：13 個型號，GLOCK 依兩種材質拆分，共 15 個規格、30 個示範 SKU。黑／沙色是待確認的示範選項，非 PDF 正式色號。
- 所有初始 100 件庫存均為虛構，不匯入正式客戶。

## PostgreSQL 與登入（需另行授權後才連接雲端）

複製 `.env.example` 到 `.env.local`，透過安全管道設定 `DATABASE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`，並設 `APP_MODE=production`。Supabase 必須關閉公開註冊，僅由管理員建立受信任的內部使用者；目前所有已登入者具有同等庫存管理權限。

Prisma CLI 的 DATABASE_URL 須透過 shell 安全注入；它不自動讀取 `.env.local`。經確認資料庫目標後執行 `npm run db:deploy`。正式模式的商品、客戶與庫存皆從空白開始，不會灌入任何示範資料。沒有設定雲端帳號或執行正式資料寫入。

PostgreSQL 將庫存 aggregate 保存為 JSONB，採 transaction advisory lock 序列化所有異動，requestId 保證重試冪等。適用單組織 MVP，後續可拆為正規化資料表。第一版每筆訂單為單一 SKU，出貨紀錄可追蹤多批次；尚無取消、退貨、多倉、角色分權、價格稅額或正式報表。登入整合尚待授權後以真實測試帳號驗證。

## 驗證

```sh
npm test
npm run typecheck
npm run build
# 僅針對隔離測試資料庫 kcrown_demo（測試會清空該庫的 InventoryState）
APP_MODE=production RUN_DB_TESTS=1 DATABASE_URL='<isolated-test-url>' npm test
```

禁止對正式資料庫執行測試。上線前必須完成 Supabase 帳號登入驗證、安全權限審查、備份及部署確認。

瀏覽器驗證：先啟動示範伺服器，再執行 `npm run test:e2e`。使用系統 Chromium，可用 `CHROMIUM_PATH` 指定路徑。測試會新增帶 E2E 前綴的示範資料。

Prisma client 透過固定版本的官方 generator／WASM parser 產生（`scripts/generate.cjs`），避免在生成階段下載不需要的原生引擎；未停用任何校驗。Prisma migration CLI 仍需 `binaries.prisma.sh` 網路存取。本機 PostgreSQL 已直接執行相同 migration SQL 驗證，尚未驗證雲端 migration。
