import { Suspense } from "react";
import { ParentChildTimeline } from "@/components/parent/parent-child-timeline";
import { ParentTimelineLoading } from "@/components/parent/parent-loading";

export default function ParentChildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<ParentTimelineLoading />}>
      <ParentChildTimeline params={params} searchParams={searchParams} />
    </Suspense>
  );
}
