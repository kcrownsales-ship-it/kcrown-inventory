import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { approvedUser, appMode } from "./access";
export async function authClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) => {
          try {
            for (const x of items) jar.set(x.name, x.value, x.options);
          } catch {
            /* Server Components cannot write cookies; middleware refreshes them. */
          }
        },
      },
    },
  );
}
export async function currentActor(): Promise<{ id: string } | null> {
  if (appMode() === "demo") return { id: "demo" };
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  return !error && data.user && approvedUser(data.user.id)
    ? { id: data.user.id }
    : null;
}
