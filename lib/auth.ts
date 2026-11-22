import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "staff" | "parent";

function isUserRole(role: unknown): role is UserRole {
  return role === "staff" || role === "parent";
}

export async function getCurrentRole(): Promise<UserRole | null> {
  if (!getSupabaseConfig()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || typeof userId !== "string") return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !isUserRole(profile?.role)) return null;

    return profile.role;
  } catch {
    return null;
  }
}

export async function requireRole(expectedRole: UserRole) {
  const role = await getCurrentRole();

  if (!role) redirect("/login");
  if (role !== expectedRole) redirect(role === "staff" ? "/staff" : "/parent");

  return role;
}
