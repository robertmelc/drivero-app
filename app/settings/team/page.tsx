import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TeamManager } from "./team-manager";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return <TeamManager />;
}
