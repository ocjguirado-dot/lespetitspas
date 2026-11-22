import type { ReactNode } from "react";
import { connection } from "next/server";
import { AreaLayout } from "@/components/auth/area-layout";
import { requireRole, type UserRole } from "@/lib/auth";

export async function ProtectedArea({
  role,
  title,
  children,
}: {
  role: UserRole;
  title: string;
  children: ReactNode;
}) {
  await connection();
  await requireRole(role);

  return <AreaLayout title={title}>{children}</AreaLayout>;
}
