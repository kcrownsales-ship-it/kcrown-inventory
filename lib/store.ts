import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma";
import { initialState, apply, type State, type Operation } from "./inventory";
export const demo = (process.env.APP_MODE ?? "demo") === "demo";
const globalStore = globalThis as unknown as {
  kcQueue?: Promise<unknown>;
  kcDb?: PrismaClient;
};
const file = path.join(process.cwd(), ".demo", "inventory.json");
const db = () =>
  globalStore.kcDb ??
  (globalStore.kcDb = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  }));
async function readDemo(): Promise<State> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return initialState();
    throw e;
  }
}
export async function readState(): Promise<State> {
  if (demo) return readDemo();
  const row = await db().inventoryState.findUnique({ where: { id: "main" } });
  return row
    ? (row.data as unknown as State)
    : { products: [], stock: {}, orders: [], movements: [], requests: [] };
}
export async function mutate(op: Operation): Promise<State> {
  if (!demo)
    return db().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(734823)`;
      let row = await tx.inventoryState.findUnique({ where: { id: "main" } });
      const base = row
        ? (row.data as unknown as State)
        : { products: [], stock: {}, orders: [], movements: [], requests: [] };
      const next = apply(base, op);
      await tx.inventoryState.upsert({
        where: { id: "main" },
        create: { id: "main", data: next as unknown as Prisma.InputJsonValue },
        update: { data: next as unknown as Prisma.InputJsonValue },
      });
      return next;
    });
  const job = (globalStore.kcQueue ?? Promise.resolve()).then(async () => {
    const next = apply(await readDemo(), op);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file + ".tmp", JSON.stringify(next));
    await fs.rename(file + ".tmp", file);
    return next;
  });
  globalStore.kcQueue = job.catch(() => {});
  return job;
}
