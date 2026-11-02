import { redirect } from "next/navigation";
import { currentActor } from "@/lib/auth";
import { readState, demo } from "@/lib/store";
import Workspace from "./workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  const actor = await currentActor();
  if (!actor) redirect("/login");
  return <Workspace state={await readState(actor.id)} demo={demo} />;
}
