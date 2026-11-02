import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma";
import { initialState, apply, type State, type Operation } from "./inventory";
import { workspaceId, appMode } from "./access";
export const demo = appMode() === "demo";
const globalStore = globalThis as unknown as { kcDb?: PrismaClient };
const db = () =>
  globalStore.kcDb ??
  (globalStore.kcDb = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  }));
const emptyState = (): State => ({
  products: [],
  stock: {},
  orders: [],
  movements: [],
  requests: [],
});
export async function readState(userId?: string): Promise<State> {
  if (demo) return initialState();
  const id = workspaceId(userId ?? "");
  const row = await db().inventoryState.findUnique({ where: { id } });
  return row ? (row.data as unknown as State) : emptyState();
}
export async function mutate(op: Operation, userId?: string): Promise<State> {
  if (demo) throw Error("Demo operations are stored only in your browser");
  const id = workspaceId(userId ?? "");
  return db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
    const row = await tx.inventoryState.findUnique({ where: { id } });
    const next = apply(row ? (row.data as unknown as State) : emptyState(), op);
    await tx.inventoryState.upsert({
      where: { id },
      create: { id, data: next as unknown as Prisma.InputJsonValue },
      update: { data: next as unknown as Prisma.InputJsonValue },
    });
    return next;
  });
}
