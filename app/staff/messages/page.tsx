import Link from "next/link";
import { Suspense } from "react";
import { MessagesList } from "@/components/staff/messages-list";
import { MessagesLoading } from "@/components/staff/messages-loading";

export default function StaffMessagesPage() {
  return (
    <section aria-label="Messages des parents" className="space-y-4">
      <Link
        className="inline-flex min-h-11 items-center text-sm font-medium text-foreground underline underline-offset-4"
        href="/staff"
      >
        Retour à la liste des enfants
      </Link>
      <h2 className="font-heading text-xl font-semibold text-foreground">Messages des parents</h2>
      <Suspense fallback={<MessagesLoading />}>
        <MessagesList />
      </Suspense>
    </section>
  );
}
