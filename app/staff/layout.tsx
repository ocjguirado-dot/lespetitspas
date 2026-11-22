import type { ReactNode } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { ProtectedArea } from "@/components/auth/protected-area";
import { ChildrenLoading } from "@/components/staff/children-loading";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ChildrenLoading />}>
      <ProtectedArea role="staff" title="Espace équipe">
        <nav aria-label="Navigation équipe" className="mb-6">
          <Link
            className="inline-flex min-h-11 items-center rounded-md border border-primary/40 bg-primary/10 px-4 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            href="/staff/messages"
          >
            Messages
          </Link>
        </nav>
        {children}
      </ProtectedArea>
    </Suspense>
  );
}
