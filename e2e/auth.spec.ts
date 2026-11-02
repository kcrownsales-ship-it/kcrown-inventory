/** Local Supabase protocol stub: tests APP authorization, NOT real Supabase login. */
import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
const alice = "33333333-3333-4333-8333-333333333333",
  bob = "44444444-4444-4444-8444-444444444444",
  outsider = "55555555-5555-4555-8555-555555555555";
let stub: Server, app: ChildProcess;
const origin = "http://127.0.0.1:3001";
const user = (id: string) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: `${id}@example.invalid`,
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: new Date().toISOString(),
});
function cookie(id: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    { alg: "HS256", typ: "JWT" },
    { sub: id, exp, aud: "authenticated" },
    "local-test-signature",
  ]
    .map((v) =>
      Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString(
        "base64url",
      ),
    )
    .join(".");
  const session = {
    access_token: token,
    refresh_token: "local-test-only",
    expires_at: exp,
    expires_in: 3600,
    token_type: "bearer",
    user: user(id),
  };
  return `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
}
test.beforeAll(async () => {
  stub = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url?.startsWith("/auth/v1/user")) {
      try {
        const token = req.headers.authorization?.split(" ")[1] ?? "";
        const id = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString(),
        ).sub;
        res.end(JSON.stringify(user(id)));
      } catch {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: "No session" }));
      }
    } else if (req.url?.startsWith("/auth/v1/logout")) {
      res.statusCode = 204;
      res.end();
    } else {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "Local stub denies sign-in" }));
    }
  });
  await new Promise<void>((resolve) =>
    stub.listen(54321, "127.0.0.1", resolve),
  );
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3001",
    ],
    {
      env: {
        ...process.env,
        APP_MODE: "production",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-test-public-key",
        AUTH_ALLOWED_USER_IDS: `${alice},${bob}`,
      },
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${origin}/login`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Local auth test server did not become ready");
});
test.afterAll(async () => {
  app?.kill("SIGTERM");
  await new Promise<void>((resolve) => stub?.close(() => resolve()));
});
test("unauthenticated and unapproved users cannot enter or mutate", async ({
  request,
}) => {
  const op = {
    requestId: randomUUID(),
    kind: "receive",
    productId: "missing",
    quantity: 1,
    reference: "TEST",
  };
  for (const c of ["", cookie(outsider)]) {
    const headers = { origin, cookie: c };
    const r = await request.post(`${origin}/api/operations`, {
      headers,
      data: op,
    });
    expect(r.status()).toBe(401);
    const page = await request.get(origin, { headers, maxRedirects: 0 });
    expect(page.status()).toBe(307);
    expect(page.headers().location).toBe("/login");
  }
});
test("Demo login endpoint is not needed; malformed login is rejected in auth mode", async ({
  request,
}) => {
  const r = await request.post(`${origin}/api/auth`, {
    headers: { origin, "Content-Type": "application/json" },
    data: "{",
  });
  expect(r.status()).toBe(400);
});
test("approved A cannot make B see A data or ship A order; owner fields are ignored", async ({
  request,
}) => {
  test.skip(!process.env.DATABASE_URL, "Requires local isolated test database");
  const url = new URL(process.env.DATABASE_URL!);
  expect(["127.0.0.1", "localhost"]).toContain(url.hostname);
  expect(url.pathname).toBe("/kcrown_demo");
  const sku = `AUTH-${Date.now()}`,
    productId = randomUUID(),
    orderId = randomUUID();
  const post = (id: string, data: object) =>
    request.post(`${origin}/api/operations`, {
      headers: { origin, cookie: cookie(id) },
      data: { requestId: randomUUID(), ...data },
    });
  expect(
    (
      await post(alice, {
        kind: "product",
        product: {
          id: productId,
          sku,
          model: sku,
          material: "Demo",
          length: "Short",
          color: "Demo",
          system: "MARUI",
          capacity: 31,
        },
        userId: bob,
        workspaceId: `user:${bob}`,
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await post(alice, {
        kind: "receive",
        productId,
        quantity: 10,
        reference: "AUTH-TEST",
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await post(alice, {
        requestId: orderId,
        kind: "order",
        productId,
        quantity: 5,
        customer: "Local test",
      })
    ).status(),
  ).toBe(200);
  const a = await request.get(origin, { headers: { cookie: cookie(alice) } });
  expect(await a.text()).toContain(sku);
  const b = await request.get(origin, { headers: { cookie: cookie(bob) } });
  expect(await b.text()).not.toContain(sku);
  expect(
    (
      await post(bob, { kind: "ship", orderId, quantity: 1, userId: alice })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post(alice, {
        kind: "ship",
        orderId,
        quantity: 1,
        reference: "AUTH-SHIP",
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post(`${origin}/api/logout`, {
        headers: { origin, cookie: cookie(alice) },
      })
    ).status(),
  ).toBe(200);
});
