import { redirect } from "next/navigation";
import { authorized } from "@/lib/auth";
import { readState, demo } from "@/lib/store";
import Workspace from "./workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await authorized())) redirect("/login");
  return <Workspace state={await readState()} demo={demo} />;
}
