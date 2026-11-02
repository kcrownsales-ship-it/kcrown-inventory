import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
test(
  "PostgreSQL: transactions, deduplication, partial shipment, user isolation and RLS",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const target = new URL(process.env.DATABASE_URL ?? "");
    if (
      !["localhost", "127.0.0.1"].includes(target.hostname) ||
      target.pathname !== "/kcrown_demo"
    )
      throw Error("Only local isolated kcrown_demo may be tested");
    const { PrismaClient } = await import("../generated/prisma");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    const { mutate, readState } = await import("../lib/store");
    const { catalogue } = await import("../lib/catalogue");
    try {
      await db.inventoryState.deleteMany({
        where: { id: { in: [`user:${alice}`, `user:${bob}`] } },
      });
      await assert.rejects(() => readState());
      await assert.rejects(() =>
        mutate({ requestId: randomUUID(), kind: "receive", quantity: 10 }),
      );
      await mutate(
        { requestId: randomUUID(), kind: "product", product: catalogue[0] },
        alice,
      );
      const receipt = {
        requestId: randomUUID(),
        kind: "receive" as const,
        productId: "p0-0",
        quantity: 100,
        reference: "TEST-PO",
      };
      await Promise.all([mutate(receipt, alice), mutate(receipt, alice)]);
      const orders = [1, 2].map(() => ({
        requestId: randomUUID(),
        kind: "order" as const,
        productId: "p0-0",
        quantity: 70,
        customer: "Isolated test",
      }));
      const race = await Promise.allSettled(
        orders.map((o) => mutate(o, alice)),
      );
      assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
      let s = await readState(alice);
      assert.equal(s.stock["p0-0"], 100);
      assert.equal(s.orders.length, 1);
      assert.equal((await readState(bob)).products.length, 0);
      await assert.rejects(() =>
        mutate(
          {
            requestId: randomUUID(),
            kind: "ship",
            orderId: s.orders[0].id,
            quantity: 1,
          },
          bob,
        ),
      );
      await mutate(
        {
          requestId: randomUUID(),
          kind: "ship",
          orderId: s.orders[0].id,
          quantity: 20,
          reference: "TEST-SHIP",
        },
        alice,
      );
      s = await readState(alice);
      assert.equal(s.stock["p0-0"], 80);
      assert.equal(s.orders[0].reserved, 50);
      assert.equal(s.orders[0].shipped, 20);
      const flags = await db.$queryRaw<
        { relrowsecurity: boolean }[]
      >`SELECT relrowsecurity FROM pg_class WHERE oid='"InventoryState"'::regclass`;
      assert.equal(flags[0].relrowsecurity, true);
      const permissions = await db.$queryRaw<
        { allowed: boolean }[]
      >`SELECT has_table_privilege('anon', '"InventoryState"', 'SELECT') AS allowed`;
      assert.equal(permissions[0].allowed, false);
    } finally {
      await db.$disconnect();
      const globalDb = (
        globalThis as unknown as { kcDb?: { $disconnect: () => Promise<void> } }
      ).kcDb;
      await globalDb?.$disconnect();
    }
  },
);
