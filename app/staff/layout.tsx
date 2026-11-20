import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProtectedArea } from "@/components/auth/protected-area";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProtectedArea role="staff" title="Espace équipe">
        {children}
      </ProtectedArea>
    </Suspense>
  );
}
