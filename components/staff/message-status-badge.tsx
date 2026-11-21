const labels: Record<string, string> = {
  nouveau: "Nouveau",
  lu: "Lu",
  traite: "Traité",
};

const styles: Record<string, string> = {
  nouveau: "border-accent bg-accent/20",
  lu: "border-secondary bg-secondary/20",
  traite: "border-primary/40 bg-primary/20",
};

export function MessageStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "border-border bg-muted"}`}>
      {labels[status] ?? "Statut indisponible"}
    </span>
  );
}
