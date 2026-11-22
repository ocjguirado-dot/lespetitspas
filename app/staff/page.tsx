import { Suspense } from "react";
import { ChildrenList } from "@/components/staff/children-list";
import { ChildrenLoading } from "@/components/staff/children-loading";

export default function StaffPage() {
  return (
    <section aria-label="Liste des enfants" className="space-y-4">
      <Suspense fallback={<ChildrenLoading />}>
        <ChildrenList />
      </Suspense>
    </section>
  );
}
