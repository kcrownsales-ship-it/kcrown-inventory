import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
test(
  "PostgreSQL concurrent reservations cannot oversell; duplicate receipts apply once",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    if (!process.env.DATABASE_URL?.includes("kcrown_demo"))
      throw Error("Only the isolated kcrown_demo database is permitted");
    const { PrismaClient } = await import("../generated/prisma");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    await db.inventoryState.deleteMany();
    const { mutate, readState } = await import("../lib/store");
    const { catalogue } = await import("../lib/catalogue");
    await mutate({
      requestId: randomUUID(),
      kind: "product",
      product: catalogue[0],
    });
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        mutate({
          requestId: randomUUID(),
          kind: "order",
          productId: "p0-0",
          quantity: 70,
          customer: "Isolated test",
        }),
      ),
    );
    // Production-mode initial quantities are zero, so seed an explicit receipt first.
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 0);
    const receive = {
      requestId: randomUUID(),
      kind: "receive" as const,
      productId: "p0-0",
      quantity: 100,
      reference: "TEST-PO",
    };
    await Promise.all([mutate(receive), mutate(receive)]);
    const race = await Promise.allSettled(
      [1, 2].map(() =>
        mutate({
          requestId: randomUUID(),
          kind: "order",
          productId: "p0-0",
          quantity: 70,
          customer: "Isolated test",
        }),
      ),
    );
    assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
    const s = await readState();
    assert.equal(s.stock["p0-0"], 100);
    assert.equal(s.orders.length, 1);
    await db.$disconnect();
  },
);
