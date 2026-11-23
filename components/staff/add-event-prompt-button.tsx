"use client";

import { Button } from "@/components/ui/button";

export function AddEventPromptButton({ childId }: { childId: string }) {
  function focusEventType() {
    const typeSelect = document.getElementById(`event-type-${childId}`);
    if (!(typeSelect instanceof HTMLSelectElement)) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    typeSelect.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    typeSelect.focus({ preventScroll: true });
  }

  return (
    <Button className="min-h-11" onClick={focusEventType} type="button">
      Ajouter un événement
    </Button>
  );
}
