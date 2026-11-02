"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { summary, type State } from "@/lib/inventory";
export default function Workspace({
  state: s,
  demo,
}: {
  state: State;
  demo: boolean;
}) {
  const [tab, setTab] = useState("庫存總覽"),
    [search, setSearch] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  const totals = s.products.reduce(
    (a, p) => {
      const v = summary(s, p.id);
      return a.map(
        (n, i) => n + [v.onHand, v.shipped, v.outstanding, v.available][i],
      );
    },
    [0, 0, 0, 0],
  );
  async function submit(e: React.FormEvent<HTMLFormElement>, kind: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setMessage("");
    try {
      const body =
        kind === "product"
          ? {
              kind,
              product: {
                ...data,
                id: crypto.randomUUID(),
                capacity: Number(data.capacity),
              },
            }
          : { ...data, kind, quantity: Number(data.quantity) };
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, requestId: crypto.randomUUID() }),
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      setMessage("已完成並儲存");
      form.reset();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setBusy(false);
    }
  }
  const skuSelect = (
    <label>
      商品 SKU
      <select name="productId">
        {s.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.sku} · {p.model} · {p.color}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          K<span>♛</span>CROWN
        </div>
        <p className="subtitle">INVENTORY WORKSPACE</p>
        <nav>
          {[
            "庫存總覽",
            "產品與 SKU",
            "採購入庫",
            "客戶訂單",
            "分批出貨",
            "異動紀錄",
          ].map((t) => (
            <button
              className={t === tab ? "active" : ""}
              key={t}
              onClick={() => {
                setTab(t);
                setMessage("");
              }}
            >
              {t}
            </button>
          ))}
        </nav>
        <small>
          Airsoft Magazine Collection
          <br />
          K-Crown · Operations
        </small>
      </aside>
      <main>
        <header>
          <div>
            <p className="eyebrow">WORKSPACE / OPERATIONS</p>
            <h1>{tab}</h1>
            <p>掌握每一筆庫存，讓每一次交付更有把握。</p>
          </div>
          <span className="badge">{demo ? "DEMO · 示範環境" : "正式環境"}</span>
        </header>
        {demo && (
          <div className="notice">
            示範資料獨立儲存，不連接正式客戶或庫存。顏色為示範選項，待正式規格確認。
          </div>
        )}
        {tab === "庫存總覽" && (
          <>
            <section className="cards">
              {["現有庫存", "累計已出貨", "未交訂單數量", "可用庫存"].map(
                (label, i) => (
                  <article key={label}>
                    <p>{label}</p>
                    <strong>{totals[i].toLocaleString()}</strong>
                    <small>PCS / 件</small>
                  </article>
                ),
              )}
            </section>
            <section className="panel">
              <div className="panelhead">
                <h2>型號與顏色庫存</h2>
                <input
                  placeholder="搜尋型號、顏色或 SKU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      {[
                        "商品 / SKU",
                        "材質 / 規格",
                        "顏色",
                        "現有",
                        "已預留",
                        "已出貨",
                        "未交",
                        "可用",
                      ].map((x) => (
                        <th key={x}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.products
                      .filter((p) =>
                        Object.values(p)
                          .join(" ")
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((p) => {
                        const v = summary(s, p.id);
                        return (
                          <tr key={p.id}>
                            <td>
                              <b>{p.model}</b>
                              <small>{p.sku}</small>
                            </td>
                            <td>
                              {p.material}
                              <small>
                                {p.length} · {p.system} · {p.capacity} RDS
                              </small>
                            </td>
                            <td>
                              <span className="color">{p.color}</span>
                            </td>
                            <td>{v.onHand}</td>
                            <td>{v.reserved}</td>
                            <td>{v.shipped}</td>
                            <td>{v.outstanding}</td>
                            <td className="available">{v.available}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        {tab === "產品與 SKU" && (
          <section className="panel">
            <h2>新增獨立 SKU</h2>
            <p>相同型號的不同材質、長短版、顏色須使用獨立 SKU。</p>
            <form onSubmit={(e) => submit(e, "product")}>
              {[
                ["sku", "SKU"],
                ["model", "產品型號"],
                ["material", "材質"],
                ["length", "長短版"],
                ["color", "顏色"],
                ["system", "相容系統"],
              ].map(([n, l]) => (
                <label key={n}>
                  {l}
                  <input name={n} maxLength={80} required />
                </label>
              ))}
              <label>
                容量 RDS
                <input name="capacity" type="number" min="1" required />
              </label>
              <button disabled={busy}>建立商品</button>
            </form>
          </section>
        )}
        {tab === "採購入庫" && (
          <section className="panel">
            <h2>採購入庫</h2>
            <p>完成入庫後立即增加現有及可用庫存。</p>
            <form onSubmit={(e) => submit(e, "receive")}>
              {skuSelect}
              <label>
                採購單號
                <input name="reference" required maxLength={200} />
              </label>
              <label>
                入庫數量
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="1000000"
                  required
                />
              </label>
              <button disabled={busy}>確認入庫</button>
            </form>
          </section>
        )}
        {tab === "客戶訂單" && (
          <>
            <section className="panel">
              <h2>建立訂單與預留</h2>
              <p>
                建立訂單會預留庫存，出貨時才扣除現有庫存。每筆訂單對應一個 SKU。
              </p>
              <form onSubmit={(e) => submit(e, "order")}>
                {skuSelect}
                <label>
                  客戶名稱
                  <input
                    name="customer"
                    placeholder="例如：示範客戶 A"
                    required
                    maxLength={200}
                  />
                </label>
                <label>
                  訂購數量
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="1000000"
                    required
                  />
                </label>
                <button disabled={busy}>建立並預留</button>
              </form>
            </section>
            <section className="panel">
              <h2>客戶訂單</h2>
              {s.orders.length === 0 ? (
                <p>尚無訂單，請建立第一筆示範訂單。</p>
              ) : (
                s.orders.map((o) => (
                  <p key={o.id}>
                    {o.customer} ·{" "}
                    {s.products.find((p) => p.id === o.productId)?.sku} ｜ 訂購{" "}
                    {o.quantity} / 已出貨 {o.shipped} / 預留 {o.reserved} ｜{" "}
                    {o.shipped === o.quantity ? "已完成" : "待出貨"}
                  </p>
                ))
              )}
            </section>
          </>
        )}
        {tab === "分批出貨" && (
          <section className="panel">
            <h2>分批出貨</h2>
            <p>每次出貨將同步扣除現有庫存與訂單預留量。</p>
            {s.orders.some((o) => o.reserved > 0) ? (
              <form onSubmit={(e) => submit(e, "ship")}>
                <label>
                  待交訂單
                  <select name="orderId">
                    {s.orders
                      .filter((o) => o.reserved > 0)
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.customer} ·{" "}
                          {s.products.find((p) => p.id === o.productId)?.sku} ·
                          剩餘 {o.reserved}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  本次出貨數量
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="1000000"
                    required
                  />
                </label>
                <label>
                  出貨單號
                  <input name="reference" required maxLength={200} />
                </label>
                <button disabled={busy}>確認出貨並扣庫存</button>
              </form>
            ) : (
              <p>目前沒有待出貨訂單。</p>
            )}
          </section>
        )}
        {tab === "異動紀錄" && (
          <section className="panel">
            <h2>庫存異動紀錄</h2>
            {s.movements.length === 0 ? (
              <p>尚無異動。</p>
            ) : (
              [...s.movements].reverse().map((m) => (
                <p key={m.id}>
                  {new Date(m.at).toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                  })}{" "}
                  ｜{" "}
                  {
                    (
                      {
                        receive: "採購入庫",
                        order: "訂單預留",
                        ship: "出貨扣庫",
                      } as Record<string, string>
                    )[m.kind]
                  }{" "}
                  ｜ {s.products.find((p) => p.id === m.productId)?.sku} ｜{" "}
                  {m.quantity} 件 ｜ {m.reference}
                </p>
              ))
            )}
          </section>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <footer>
          CATALOGUE-BASED PRODUCTS · {s.products.length} SKUs · 數量單位：件
        </footer>
      </main>
    </div>
  );
}
