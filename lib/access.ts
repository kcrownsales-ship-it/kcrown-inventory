/** Access is denied by default; only explicitly approved Supabase user IDs enter. */
export function approvedUser(
  id: string,
  allowlist = process.env.AUTH_ALLOWED_USER_IDS ?? "",
) {
  return allowlist
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(id);
}
export function workspaceId(userId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  )
    throw Error("A verified user identity is required");
  return `user:${userId}`;
}
export function appMode(value = process.env.APP_MODE) {
  if (value === "production") return "production";
  if (value === "demo" || (!value && !process.env.VERCEL)) return "demo";
  throw Error("Set APP_MODE explicitly to demo or production");
}
