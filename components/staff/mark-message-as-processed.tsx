"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markMessageAsProcessed } from "@/app/actions/messages";

export function MarkMessageAsProcessed({ messageId }: { messageId: string }) {
  const attempted = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (attempted.current) return;
    attempted.current = true;
    setIsPending(true);
    setHasError(false);

    startTransition(async () => {
      try {
        const result = await markMessageAsProcessed(messageId);
        if (result === "error") {
          attempted.current = false;
          setHasError(true);
          return;
        }
        router.refresh();
      } catch {
        attempted.current = false;
        setHasError(true);
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleClick}
        type="button"
      >
        {isPending ? "Mise à jour…" : "Marquer comme traité"}
      </button>
      {hasError ? (
        <p className="text-sm text-destructive" role="alert">
          Le statut n’a pas pu être mis à jour.
        </p>
      ) : null}
    </div>
  );
}
