import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProtectedArea } from "@/components/auth/protected-area";
import { ChildrenLoading } from "@/components/staff/children-loading";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ChildrenLoading />}>
      <ProtectedArea role="staff" title="Espace équipe">
        {children}
      </ProtectedArea>
    </Suspense>
  );
}
