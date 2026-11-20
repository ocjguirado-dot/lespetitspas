import { Suspense } from "react";
import { ChildDetails } from "@/components/staff/child-details";
import { ChildLoading } from "@/components/staff/child-loading";

export default function ChildPage({ params }: PageProps<"/staff/children/[id]">) {
  return (
    <Suspense fallback={<ChildLoading />}>
      <ChildDetails params={params} />
    </Suspense>
  );
}
