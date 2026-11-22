import { Suspense } from "react";
import { ParentMessages } from "@/components/parent/parent-messages";
import { ParentMessagesLoading } from "@/components/parent/parent-loading";

export default function ParentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<ParentMessagesLoading />}>
      <ParentMessages searchParams={searchParams} />
    </Suspense>
  );
}
