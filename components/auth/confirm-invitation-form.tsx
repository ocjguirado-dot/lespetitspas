"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifyInvitation, type VerifyInvitationState } from "@/app/actions/invitations-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const initialState: VerifyInvitationState = {};

export function ConfirmInvitationForm({ tokenHash, type, next }: { tokenHash: string; type: string; next: string }) {
  const [state, formAction, pending] = useActionState(verifyInvitation, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <input name="token_hash" type="hidden" value={tokenHash} />
      <input name="type" type="hidden" value={type} />
      <input name="next" type="hidden" value={next} />
      <Button className="min-h-11 w-full" disabled={pending} type="submit">
        {pending ? "Vérification en cours…" : "Continuer"}
      </Button>
      {state.error ? (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>
            {state.error} <Link className="underline underline-offset-4" href="/login">Aller à la connexion</Link>
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
