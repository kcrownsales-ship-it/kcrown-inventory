import { sameOrigin } from "@/lib/origin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentActor } from "@/lib/auth";
import { mutate, demo } from "@/lib/store";
const schema = z.object({
  requestId: z.string().uuid(),
  kind: z.enum(["receive", "order", "ship", "product"]),
  productId: z.string().max(100).optional(),
  quantity: z.number().int().positive().max(1000000).optional(),
  customer: z.string().max(200).optional(),
  orderId: z.string().max(100).optional(),
  reference: z.string().max(200).optional(),
  product: z
    .object({
      id: z.string().uuid(),
      sku: z.string().min(1).max(80),
      model: z.string().min(1).max(100),
      material: z.string().min(1).max(80),
      length: z.string().min(1).max(40),
      color: z.string().min(1).max(80),
      system: z.string().min(1).max(80),
      capacity: z.number().int().positive(),
    })
    .optional(),
});
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "請先登入" }, { status: 401 });
  try {
    const input = schema.parse(await req.json());
    if (demo)
      return NextResponse.json(
        { error: "Demo 資料只保存於瀏覽器，不接受伺服器寫入" },
        { status: 409 },
      );
    await mutate(input, actor.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "輸入格式錯誤"
            : e instanceof Error
              ? e.message
              : "操作失敗",
      },
      { status: 400 },
    );
  }
}
