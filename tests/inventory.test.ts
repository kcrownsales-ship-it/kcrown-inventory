import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, initialState, summary } from "../lib/inventory";
import { randomUUID } from "node:crypto";
const id = () => randomUUID();
test("reserve, partial shipment, complete shipment and dashboard", () => {
  let s = initialState();
  const order = id();
  s = apply(s, {
    requestId: order,
    kind: "order",
    productId: "p0-0",
    quantity: 30,
    customer: "Demo",
  });
  assert.deepEqual(summary(s, "p0-0"), {
    onHand: 100,
    reserved: 30,
    available: 70,
    shipped: 0,
    outstanding: 30,
  });
  s = apply(s, { requestId: id(), kind: "ship", orderId: order, quantity: 12 });
  assert.deepEqual(summary(s, "p0-0"), {
    onHand: 88,
    reserved: 18,
    available: 70,
    shipped: 12,
    outstanding: 18,
  });
  s = apply(s, { requestId: id(), kind: "ship", orderId: order, quantity: 18 });
  assert.equal(summary(s, "p0-0").outstanding, 0);
  assert.equal(summary(s, "p0-0").onHand, 70);
});
test("reject overselling and overshipping without mutating state", () => {
  let s = initialState();
  const order = id();
  s = apply(s, {
    requestId: order,
    kind: "order",
    productId: "p0-0",
    quantity: 90,
    customer: "Demo",
  });
  const before = structuredClone(s);
  assert.throws(() =>
    apply(s, {
      requestId: id(),
      kind: "order",
      productId: "p0-0",
      quantity: 11,
      customer: "Other",
    }),
  );
  assert.throws(() =>
    apply(s, { requestId: id(), kind: "ship", orderId: order, quantity: 91 }),
  );
  assert.deepEqual(s, before);
});
test("receipt is idempotent and isolates SKUs", () => {
  let s = initialState();
  const op = {
    requestId: id(),
    kind: "receive" as const,
    productId: "p0-0",
    quantity: 25,
    reference: "PO-DEMO",
  };
  s = apply(s, op);
  s = apply(s, op);
  assert.equal(summary(s, "p0-0").onHand, 125);
  assert.equal(summary(s, "p0-1").onHand, 100);
});
test("reject invalid quantities and missing purchase reference", () => {
  for (const q of [0, -1, 1.5, NaN])
    assert.throws(() =>
      apply(initialState(), {
        requestId: id(),
        kind: "receive",
        productId: "p0-0",
        quantity: q,
        reference: "PO",
      }),
    );
  assert.throws(() =>
    apply(initialState(), {
      requestId: id(),
      kind: "receive",
      productId: "p0-0",
      quantity: 1,
    }),
  );
});
