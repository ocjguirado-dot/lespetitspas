"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addMeal, type MealActionState } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const initialState: MealActionState = { revision: 0 };
const emptyValues = { moment: "", qualite: "", note: "" };
const validMoments = ["matin", "midi", "gouter"];
const validQualities = ["tout", "moitie", "peu", "rien"];

function allowedValue(value: string, allowedValues: string[]): string {
  return allowedValues.includes(value) ? value : "";
}

export function AddMealForm({ childId }: { childId: string }) {
  const [state, formAction, pending] = useActionState(addMeal.bind(null, childId), initialState);
  const [draft, setDraft] = useState({ revision: 0, values: emptyValues });
  const submissionLock = useRef(false);
  const router = useRouter();
  const childPath = `/staff/children/${childId}`;
  const values = draft.revision === state.revision
    ? draft.values
    : state.values
      ? {
          moment: allowedValue(state.values.moment, validMoments),
          qualite: allowedValue(state.values.qualite, validQualities),
          note: state.values.note,
        }
      : emptyValues;

  useEffect(() => {
    if (!pending) submissionLock.current = false;
  }, [pending]);

  useEffect(() => {
    if (state.success && (window.location.pathname !== childPath || window.location.search)) {
      window.history.replaceState(null, "", childPath);
      router.refresh();
    }
  }, [childPath, router, state.revision, state.success]);

  function updateValue(field: keyof typeof emptyValues, value: string) {
    setDraft({ revision: state.revision, values: { ...values, [field]: value } });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || submissionLock.current) return;

    submissionLock.current = true;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const momentErrorId = `meal-moment-error-${childId}`;
  const qualityErrorId = `meal-quality-error-${childId}`;
  const noteErrorId = `meal-note-error-${childId}`;

  return (
    <section aria-labelledby={`meal-form-heading-${childId}`}>
      <Card className="items-start gap-4 p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold" id={`meal-form-heading-${childId}`}>Ajouter un repas</h2>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor={`meal-moment-${childId}`}>Moment</Label>
              <select
                aria-describedby={state.errors?.moment ? momentErrorId : undefined}
                aria-invalid={Boolean(state.errors?.moment)}
                aria-required="true"
                className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                id={`meal-moment-${childId}`}
                name="moment"
                onChange={(event) => updateValue("moment", event.target.value)}
                value={values.moment}
              >
                <option value="">Choisir un moment</option>
                <option value="matin">Matin</option>
                <option value="midi">Midi</option>
                <option value="gouter">Goûter</option>
              </select>
              {state.errors?.moment ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={momentErrorId} role="alert">{state.errors.moment}</p> : null}
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor={`meal-quality-${childId}`}>Qualité</Label>
              <select
                aria-describedby={state.errors?.qualite ? qualityErrorId : undefined}
                aria-invalid={Boolean(state.errors?.qualite)}
                aria-required="true"
                className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
                id={`meal-quality-${childId}`}
                name="qualite"
                onChange={(event) => updateValue("qualite", event.target.value)}
                value={values.qualite}
              >
                <option value="">Choisir une qualité</option>
                <option value="tout">A tout mangé</option>
                <option value="moitie">A mangé la moitié</option>
                <option value="peu">A peu mangé</option>
                <option value="rien">N&apos;a rien mangé</option>
              </select>
              {state.errors?.qualite ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={qualityErrorId} role="alert">{state.errors.qualite}</p> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`meal-note-${childId}`}>Note (facultative)</Label>
            <textarea
              aria-describedby={state.errors?.note ? noteErrorId : undefined}
              aria-invalid={Boolean(state.errors?.note)}
              className="min-h-24 w-full min-w-0 resize-y rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:text-sm"
              id={`meal-note-${childId}`}
              maxLength={500}
              name="note"
              onChange={(event) => updateValue("note", event.target.value)}
              value={values.note}
            />
            {state.errors?.note ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" id={noteErrorId} role="alert">{state.errors.note}</p> : null}
          </div>

          {state.formError ? <p className="border-s-2 border-destructive ps-2 text-sm font-medium text-foreground" role="alert">{state.formError}</p> : null}
          {state.success ? <p aria-live="polite" className="text-sm font-medium text-foreground" role="status">{state.success}</p> : null}

          <Button className="min-h-11 w-full sm:w-auto" disabled={pending} type="submit">
            {pending ? "Enregistrement…" : "Enregistrer le repas"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
