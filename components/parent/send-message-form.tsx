"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendParentMessage } from "@/app/actions/parent-messages";

export type ParentMessageChild = { id: string; first_name: string; last_name: string };

function messageError(body: string): string | null {
  if (!body.trim()) return "Saisissez un message.";
  if (Array.from(body.trim()).length > 500) return "Le message ne peut pas dépasser 500 caractères.";
  return null;
}

export function SendMessageForm({
  childOptions,
  initialChildId,
}: {
  childOptions: ParentMessageChild[];
  initialChildId: string;
}) {
  const [childId, setChildId] = useState(initialChildId);
  const [body, setBody] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const attempted = useRef(false);
  const router = useRouter();
  const count = Array.from(body).length;
  const currentError = fieldError ?? (count > 500 ? "Le message ne peut pas dépasser 500 caractères." : null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (attempted.current || isPending) return;

    const validationError = messageError(body);
    if (validationError) {
      setFieldError(validationError);
      setSuccess(false);
      return;
    }
    if (!childId) {
      setFormError("Choisissez un enfant.");
      return;
    }

    attempted.current = true;
    setIsPending(true);
    setFieldError(null);
    setFormError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const result = await sendParentMessage(childId, body);
        if (result === "sent") {
          setBody("");
          setFieldError(null);
          setSuccess(true);
          attempted.current = false;
          router.refresh();
          return;
        }

        attempted.current = false;
        if (result === "message-required") setFieldError("Saisissez un message.");
        else if (result === "message-too-long") setFieldError("Le message ne peut pas dépasser 500 caractères.");
        else if (result === "invalid-child" || result === "child-not-attached") {
          setFormError("Choisissez un enfant rattaché à votre compte.");
        } else if (result === "invalid-message") {
          setFieldError("Le message n’est pas valide.");
        } else {
          setFormError("Le message n’a pas pu être envoyé. Vérifiez votre connexion puis réessayez.");
        }
      } catch {
        attempted.current = false;
        setFormError("Le message n’a pas pu être envoyé. Vérifiez votre connexion puis réessayez.");
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <section aria-labelledby="send-message-heading" className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <h2 className="font-heading text-lg font-semibold text-foreground" id="send-message-heading">Écrire à l’équipe</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="message-child">Enfant concerné</label>
          <select
            className="min-h-11 min-w-0 rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            id="message-child"
            onChange={(event) => setChildId(event.currentTarget.value)}
            value={childId}
          >
            {childOptions.map((child) => (
              <option key={child.id} value={child.id}>{child.first_name} {child.last_name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="message-body">Votre message</label>
          <p className="text-sm text-muted-foreground" id="message-warning">
            Pour protéger votre enfant, ne saisissez pas d’information médicale ou sensible.
          </p>
          <textarea
            aria-describedby={`message-warning message-count${currentError ? " message-error" : ""}`}
            aria-invalid={Boolean(currentError)}
            className="min-h-32 min-w-0 resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            id="message-body"
            onChange={(event) => {
              setBody(event.currentTarget.value);
              setFieldError(null);
              setSuccess(false);
            }}
            value={body}
          />
          <p className="text-sm text-muted-foreground" id="message-count" aria-live="polite">{count} / 500 caractères</p>
          {currentError ? <p className="text-sm text-destructive" id="message-error" role="alert">{currentError}</p> : null}
        </div>

        {formError ? <p className="text-sm text-destructive" role="alert">{formError}</p> : null}
        {success ? <p className="text-sm font-medium text-foreground" role="status">Message envoyé à l’équipe.</p> : null}
        <button
          className="min-h-11 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isPending || count > 500 || !body.trim() || !childId}
          type="submit"
        >
          {isPending ? "Envoi…" : "Envoyer"}
        </button>
      </form>
    </section>
  );
}
