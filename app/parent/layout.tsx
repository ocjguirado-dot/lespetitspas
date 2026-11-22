import type { ReactNode } from "react";
import { Suspense } from "react";
import { ProtectedArea } from "@/components/auth/protected-area";
import { ParentNavigation } from "@/components/parent/parent-navigation";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProtectedArea role="parent" title="Espace parent">
        <ParentNavigation />
        {children}
      </ProtectedArea>
    </Suspense>
  );
}
