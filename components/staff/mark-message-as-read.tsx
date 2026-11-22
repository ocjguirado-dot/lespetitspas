"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markMessageAsRead } from "@/app/actions/messages";
import { shouldMarkAsRead } from "@/lib/messages/status.mjs";

export function MarkMessageAsRead({ messageId, status }: { messageId: string; status: string }) {
  const attempted = useRef(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!shouldMarkAsRead(status) || attempted.current) return;
    attempted.current = true;

    startTransition(async () => {
      try {
        const result = await markMessageAsRead(messageId);
        if (result === "error") {
          setHasError(true);
          return;
        }
        router.refresh();
      } catch {
        setHasError(true);
      }
    });
  }, [messageId, router, status]);

  if (!hasError) return null;

  return <p className="text-sm text-destructive" role="alert">Le statut n’a pas pu être mis à jour.</p>;
}
