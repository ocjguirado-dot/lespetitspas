import { Suspense } from "react";
import { MessageDetails } from "@/components/staff/message-details";
import { MessageLoading } from "@/components/staff/message-loading";

export default function StaffMessagePage({ params }: PageProps<"/staff/messages/[id]">) {
  return (
    <Suspense fallback={<MessageLoading />}>
      <MessageDetails params={params} />
    </Suspense>
  );
}
