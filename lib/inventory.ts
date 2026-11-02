import { catalogue, type Product } from "./catalogue";
export type Order = {
  id: string;
  customer: string;
  productId: string;
  quantity: number;
  shipped: number;
  reserved: number;
};
export type Movement = {
  id: string;
  at: string;
  kind: string;
  productId: string;
  quantity: number;
  reference: string;
};
export type State = {
  products: Product[];
  stock: Record<string, number>;
  orders: Order[];
  movements: Movement[];
  requests: string[];
};
export function initialState(): State {
  return {
    products: structuredClone(catalogue),
    stock: Object.fromEntries(catalogue.map((p) => [p.id, 100])),
    orders: [],
    movements: [],
    requests: [],
  };
}
export function summary(s: State, id: string) {
  const orders = s.orders.filter((o) => o.productId === id);
  const reserved = orders.reduce((n, o) => n + o.reserved, 0);
  return {
    onHand: s.stock[id] ?? 0,
    reserved,
    available: (s.stock[id] ?? 0) - reserved,
    shipped: orders.reduce((n, o) => n + o.shipped, 0),
    outstanding: orders.reduce((n, o) => n + o.quantity - o.shipped, 0),
  };
}
export type Operation = {
  requestId: string;
  kind: "receive" | "order" | "ship" | "product";
  productId?: string;
  quantity?: number;
  customer?: string;
  orderId?: string;
  reference?: string;
  product?: Product;
};
export function apply(s: State, op: Operation): State {
  if (s.requests.includes(op.requestId)) return s;
  const n = structuredClone(s);
  if (op.kind === "product") {
    const p = op.product;
    if (
      !p ||
      Object.values(p).some((v) => typeof v === "string" && !v.trim()) ||
      !Number.isSafeInteger(p.capacity) ||
      p.capacity < 1
    )
      throw Error("商品欄位不完整");
    if (n.products.some((x) => x.sku === p.sku || x.id === p.id))
      throw Error("SKU 已存在");
    n.products.push(p);
    n.stock[p.id] = 0;
  } else {
    const q = op.quantity;
    if (!q || !Number.isSafeInteger(q) || q < 1 || q > 1000000)
      throw Error("數量須為 1–1,000,000 的整數");
    let id = op.productId;
    if (op.kind === "ship") {
      const o = n.orders.find((o) => o.id === op.orderId);
      if (!o) throw Error("找不到訂單");
      id = o.productId;
      if (q > o.reserved || q > o.quantity - o.shipped)
        throw Error("出貨量超過訂單預留量");
      if (q > (n.stock[id] ?? 0)) throw Error("庫存不足");
      o.shipped += q;
      o.reserved -= q;
      n.stock[id] -= q;
    } else {
      if (!n.products.some((p) => p.id === id)) throw Error("找不到 SKU");
      id = id!;
      if (op.kind === "receive") {
        if (!op.reference?.trim()) throw Error("請填採購單號");
        n.stock[id] += q;
      } else {
        if (!op.customer?.trim()) throw Error("請填客戶名稱");
        if (q > summary(n, id).available) throw Error("可用庫存不足，無法預留");
        n.orders.push({
          id: op.requestId,
          customer: op.customer.trim(),
          productId: id,
          quantity: q,
          shipped: 0,
          reserved: q,
        });
      }
    }
    n.movements.push({
      id: op.requestId,
      at: new Date().toISOString(),
      kind: op.kind,
      productId: id!,
      quantity: q,
      reference: op.reference || op.orderId || op.customer || "",
    });
  }
  n.requests.push(op.requestId);
  return n;
}
