"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inviteParent } from "@/app/actions/parent-invitations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const messages = {
  sent: "Invitation envoyée.",
  resent: "Invitation renvoyée.",
  "linked-existing": "Ce parent a déjà un compte : l’enfant a été rattaché à son compte existant, aucun email envoyé.",
  "already-active": "Ce parent a déjà activé son compte.",
  "invalid-email": "Saisissez une adresse email valide.",
  error: "L’invitation n’a pas pu être envoyée. Vérifiez la configuration puis réessayez.",
} as const;

export function ParentInvitationForm({ childId, initialEmail }: { childId: string; initialEmail?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sending = useRef(false);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [result, setResult] = useState<keyof typeof messages | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "");
    startTransition(async () => {
      try {
        const actionResult = await inviteParent(childId, submittedEmail);
        setResult(actionResult);
        if (actionResult === "sent" || actionResult === "resent" || actionResult === "linked-existing") {
          if (!initialEmail) setEmail("");
          router.refresh();
        }
      } finally {
        sending.current = false;
      }
    });
  }

  return (
    <form className="mt-4 space-y-3 border-t pt-4" onSubmit={submit}>
      {initialEmail ? (
        <input name="email" type="hidden" value={email} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`invite-email-${childId}`}>Inviter un parent</Label>
          <Input
            autoComplete="email"
            className="min-w-0"
            id={`invite-email-${childId}`}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nom@exemple.fr"
            required
            type="email"
            value={email}
          />
        </div>
      )}
      <Button className="min-h-11 w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? "Envoi en cours…" : initialEmail ? "Renvoyer l’invitation" : "Envoyer l’invitation"}
      </Button>
      {result && (
        <Alert aria-live="polite" variant={result === "error" || result === "invalid-email" ? "destructive" : "default"}>
          <AlertDescription>{messages[result]}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
