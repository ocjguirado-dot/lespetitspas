"use client";

import { useActionState } from "react";
import { setInvitationPassword, type SetPasswordState } from "@/app/actions/invitations-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SetPasswordState = {};

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(setInvitationPassword, initialState);
  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="new-password">Mot de passe</Label>
        <Input autoComplete="new-password" id="new-password" minLength={8} name="password" required type="password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-confirmation">Confirmer le mot de passe</Label>
        <Input autoComplete="new-password" id="password-confirmation" minLength={8} name="confirmation" required type="password" />
      </div>
      <Button className="min-h-11 w-full" disabled={pending} type="submit">
        {pending ? "Enregistrement en cours…" : "Enregistrer le mot de passe"}
      </Button>
      {state.error ? (
        <Alert aria-live="polite" variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
