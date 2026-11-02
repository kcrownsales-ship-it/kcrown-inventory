# K-Crown 測試部署操作指南

狀態：已準備部署設定，尚未授權任何雲端帳號、建立雲端部署或連接 Supabase。不要把 Preview 當成正式上線。

## 第一階段：不需資料庫的可操作 Demo

你已有 Supabase 帳號；這一階段先不使用它，不需提供任何 Key。

1. 前往 https://vercel.com/signup 建立帳號。可使用 GitHub 登入；在 GitHub 授權畫面只開放 `kcrownsales-ship-it/kcrown-inventory`。授權須由你親自確認。
2. 在自己的電腦安裝 Node.js 22.12+／Git，執行下列指令。Vercel CLI 的登入會開啟瀏覽器；不要將登入 Token 貼入聊天。

   ```sh
   git clone --branch feat/airsoft-inventory-mvp https://github.com/kcrownsales-ship-it/kcrown-inventory.git
   cd kcrown-inventory
   npm ci
   npx vercel login
   npx vercel link
   ```

3. `vercel link` 選擇自己的帳號範圍，建立獨立的 `kcrown-inventory-demo` 專案，目錄用目前目錄。專案為 Next.js；儲存庫的 `vercel.json` 已定義安裝與 Build 指令。
4. 在 Vercel 專案 Settings → Build and Deployment 選擇 Node.js 22.x。Settings → Environment Variables 新增 `APP_MODE`，值為 `demo`，僅選 **Preview**。也可用 `npx vercel env add APP_MODE preview` 並輸入 `demo`。
5. 執行 `npx vercel deploy`，**不要加 `--prod`**。這是 Preview 測試部署；不要改動 production branch 或合併 main。CLI 成功後會提供真正的 HTTPS 預覽網址。若使用 Deployment Protection，需要以你的 Vercel 帳號登入後操作。
6. 將預覽網址回覆在聊天中（網址可以公開，Token 不行），我才能協助確認該次雲端部署。沒有實際網址及雲端驗證之前，不宣稱已部署成功。

Demo 不會開啟登入或連接資料庫。30 個示範 SKU 及所有操作保存在本瀏覽器同一網域的 localStorage；不同使用者／瀏覽器互不共享。清除瀏覽器資料或更換 Preview 網域將看不到先前的 Demo 操作，可用「重設示範資料」恢復。Demo 只供單頁試用，不保證多分頁同步，禁止輸入真實客戶或業務資料。

### 瀏覽器驗收

1. 庫存總覽：確認 DEMO 標示、型號及顏色、現有／已出貨／未交／可用數量。
2. 產品與 SKU：檢視列表並建立獨立 SKU。
3. 採購入庫：選新 SKU，入庫 20 件。
4. 客戶訂單：同 SKU 下單 12 件，確認預留量 12、可用量 8。
5. 分批出貨：出貨 5 件，確認現有 15、預留 7、已出貨 5、未交 7、可用 8。
6. 重新整理確認資料保留；無痕視窗確認看不到原視窗新增的 SKU／訂單。

## 第二階段：Supabase 測試專案與登入（須先確認連接授權）

不要使用正式業務資料庫。建立 `kcrown-inventory-staging` 專案，與未來正式環境分開。

1. 登入 https://supabase.com/dashboard → New project，選組織、專案名稱、鄰近使用者的 Region，產生強資料庫密碼並存在你的密碼管理器。費用方案由你選擇。
2. Authentication → Providers / Sign In 設定中啟用 Email／Password。停用公開註冊（Allow new users to sign up）；由管理員在 Authentication → Users 建立或邀請測試使用者，不要用正式客戶資料。
3. Authentication → Users 複製你核准的測試帳號 UUID，放進 `AUTH_ALLOWED_USER_IDS`；逗號分隔。未列入者即使 Supabase 登入成功也不能進入 APP。現階段每位核准使用者有自己的私人工作區，沒有共用團隊庫存或角色分級。
4. 專案 Settings → API / API Keys 複製 Project URL 與公開的 anon legacy key（或受支援的 publishable key）。只使用公開 key，不使用 `service_role`／secret key。
5. 專案 Connect 取得 PostgreSQL 連線。`DATABASE_URL` 使用 Supavisor Transaction pooler 的 URI（適合 Vercel；通常 6543）；`DIRECT_URL` 使用可連通的 direct URI 或 Session pooler URI（通常 5432）供 Prisma migrations。密碼中的特殊字元須 URL encode。保持 TLS 驗證，依 Supabase 的連線畫面下載／配置正確 CA，不要使用 `rejectUnauthorized=false`、`sslmode=no-verify`。
6. 由你在 Vercel 的獨立 staging 專案或隔離的 Preview 分支安全輸入變數。不要將密碼／URI／Key 放進 GitHub、PR 或聊天。切勿將正式變數套用到 Demo 專案。
7. 先確認測試專案的目標與資料庫，再授權執行 `npm run db:deploy`。此步會建立資料表／限制直接存取，不能在未確認的正式資料庫執行。產生 Prisma Client 不會執行 migrations，Build 也不自動寫入資料庫。
8. 授權後才以兩個測試帳號驗證：未核准登入拒絕、核准登入、登出、session refresh、A 建立訂單而 B 看不到／不能出貨、Data API 不能直接讀寫 InventoryState。這些真實 Supabase 操作目前尚未執行。

### 環境變數清單

| 名稱                            | Demo Preview | Supabase 測試／將來正式                                  | 取得方式與存放位置                                      |
| ------------------------------- | ------------ | -------------------------------------------------------- | ------------------------------------------------------- |
| `APP_MODE`                      | `demo`       | `production`（代表需登入的資料庫模式，不代表已正式上線） | Vercel 各環境明確設定；錯誤模式拒絕啟動                 |
| `DATABASE_URL`                  | 不設定       | 必填、私密                                               | Supabase Connect，Transaction pooler；僅 server         |
| `DIRECT_URL`                    | 不設定       | migrations 必填、私密                                    | Direct 或 Session pooler；安全的 migration 工作階段使用 |
| `NEXT_PUBLIC_SUPABASE_URL`      | 不設定       | 必填、公開                                               | Supabase Project URL                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 不設定       | 必填、公開 key                                           | Supabase API Keys；不能用 service role key              |
| `AUTH_ALLOWED_USER_IDS`         | 不設定       | 必填、核准使用者 UUID                                    | Supabase Authentication → Users；空白時全部拒絕         |

需要你手動提供的非敏感資訊：Vercel Preview 網址、Supabase 測試專案是否已建好、是否授權連接／遷移該測試專案。私密值直接輸入服務設定，不傳給聊天。

## Prisma／Supabase 安全邊界

Next.js Route Handler 以 Supabase `getUser()` 驗證身分，再核對核准名單；資料的 workspace ID 只能由伺服器取得的 user UUID 產生，從不接受 request body 指定擁有者。Prisma 以 server-only 資料庫連線存取每個使用者自己的 JSONB aggregate，交易鎖避免超賣，requestId 防止重複入帳。

第二個 migration 啟用 RLS 並撤銷 anon／authenticated 的直接資料表權限，不開放 Supabase Data API 直接讀寫。Privileged PostgreSQL 連線仍可能 bypass RLS，因此 server 端使用者範圍檢查不可省略。APP 不使用 Supabase service role key。

舊版的 `main` aggregate 不會自動分配給任何使用者；真實既有資料搬遷必須另行審查，這版不做搬遷。

## Pull Request 與正式上線

PR 來源為 `feat/airsoft-inventory-mvp`、目標為 `main`。只有你審查同意後才合併。若自動建立 PR 被 API 存取限制阻擋，可開啟：
https://github.com/kcrownsales-ship-it/kcrown-inventory/compare/main...feat/airsoft-inventory-mvp?expand=1

PR 描述已準備在 `docs/PR_DESCRIPTION.md`。GitHub Actions 工作流已新增，但要等 GitHub 實際執行後才能宣稱 CI 通過。

正式部署需另外確認：實際 Supabase 登入／兩帳號隔離驗收、資料備份與還原、權限策略、網域、正式變數、資料匯入及費用。這些確認不包含在 Demo Preview 授權內。
