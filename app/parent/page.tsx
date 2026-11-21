import { Suspense } from "react";
import { ParentChildrenList } from "@/components/parent/parent-children-list";
import { ParentChildrenLoading } from "@/components/parent/parent-loading";

export default function ParentPage() {
  return (
    <Suspense fallback={<ParentChildrenLoading />}>
      <ParentChildrenList />
    </Suspense>
  );
}
