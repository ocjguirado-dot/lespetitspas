"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RetryChildrenButton() {
  const router = useRouter();

  return (
    <Button className="min-h-11" onClick={() => router.refresh()} type="button" variant="outline">
      Réessayer
    </Button>
  );
}
