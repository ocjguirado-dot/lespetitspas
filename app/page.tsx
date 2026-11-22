import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";

export default async function Home() {
  const role = await getCurrentRole();
  redirect(role === "staff" ? "/staff" : role === "parent" ? "/parent" : "/login");
}
